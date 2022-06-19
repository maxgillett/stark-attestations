%builtins output range_check bitwise 

# Keccak code from https://github.com/starkware-libs/cairo-examples/tree/master/keccak
from lib.keccak import keccak, finalize_keccak
from lib.bytes_utils import IntArray, swap_endian

# Storage verification code from https://github.com/OilerNetwork/fossil
from lib.storage_verification.keccak import keccak256
from lib.storage_verification.trie_proofs import verify_proof
from lib.storage_verification.pow import pow
from lib.storage_verification.extract_from_rlp import extract_data, extractElement
from lib.storage_verification.types import IntsSequence, reconstruct_ints_sequence_list
from lib.storage_verification.swap_endianness import swap_endianness_four_words
from lib.storage_verification.comp_arr import arr_eq
from lib.storage_verification.concat_arr import concat_arr

from starkware.cairo.common.cairo_secp.bigint import BigInt3
from starkware.cairo.common.cairo_secp.signature import recover_public_key, public_key_point_to_eth_address

from starkware.cairo.common.uint256 import Uint256, uint256_unsigned_div_rem, split_64
from starkware.cairo.common.registers import get_fp_and_pc
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin
from starkware.cairo.common.math import unsigned_div_rem, split_felt
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.serialize import serialize_word

const ACCOUNT = 1
const STORAGE = 2

struct Signature:
    member message: IntArray
    member r: BigInt3
    member s: BigInt3
    member v: felt
end

struct StorageProof:
    member key: IntArray
    member value: IntArray
    member proof: IntsSequence*
end

struct Proof:
    member public_eth_address: felt
    member token_balance_min: felt
    member block_number: felt
    member account_address: felt
    member state_root: IntArray
    member storage_slot: IntArray
    member storage_hash: IntArray
    member storage_proof: StorageProof
    member storage_proof_len: felt
    member signature: Signature
end

func u256_to_bigint3{range_check_ptr}(a: Uint256) -> (res: BigInt3):
    alloc_locals
    local base : Uint256 =  Uint256(low=2 ** 86, high=0)
    let (n0, d0) = uint256_unsigned_div_rem(a, base)    
    let (n1, d1) = uint256_unsigned_div_rem(n0, base)   
    let (_, d2) = uint256_unsigned_div_rem(n1, base)    
    local res : BigInt3 = BigInt3(d0.low, d1.low, d2.low)
    return (res)
end

func felt_to_int_array{range_check_ptr}(a: felt) -> (res: felt*):
    alloc_locals
    let (hi, lo) = split_felt(a)
    let (local res : felt*) = alloc()
    let (r0, r1) = split_64(lo)
    let (r2, r3) = split_64(hi)
    assert res[0] = r3
    assert res[1] = r2
    assert res[2] = r1
    assert res[3] = r0
    return (res)
end

func int_array_to_felt(a: felt*, word_len: felt) -> (res: felt):
    if word_len == 1:
        return (a[0])
    end
    if word_len == 2:
        return (a[1] + a[0]*2**64)
    end
    if word_len == 3:
        return (a[2] + a[1]*2**64 + a[0]*2**128)
    end
    if word_len == 4:
        return (a[3] + a[2]*2**64 + a[1]*2**128 + a[0]*2**192)
    end
    return (0)
end

func to_ints_seq(int_array: IntArray) -> (res: IntsSequence):
    let res = IntsSequence(
        element=int_array.elements,
        element_size_words=int_array.word_len,
        element_size_bytes=int_array.byte_len
    )
    return (res)
end

# Slice to four 64 bit words, beginning from start_pos
func slice_arr(
        array: felt*,
        start_pos: felt) -> (res: IntArray):
    alloc_locals
    let (elements : felt*) = alloc()
    assert elements[0] = array[start_pos]
    assert elements[1] = array[start_pos + 1]
    assert elements[2] = array[start_pos + 2]
    assert elements[3] = array[start_pos + 3]
    local res: IntArray = IntArray(elements=elements, word_len=4, byte_len=32)
    return (res)
end

func extract_message_contents(message: IntArray) -> (
    eth_address: felt, storage_root: IntArray, storage_key: IntArray):
    alloc_locals
    let (eth_address) = int_array_to_felt(message.elements + 4, 4)
    let (storage_root) = slice_arr(message.elements, 8)
    let (storage_key) = slice_arr(message.elements, 12)
    return (eth_address, storage_root, storage_key)
end

func encode_kv_position{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
        slot: IntArray, address: IntArray) -> (key : IntsSequence):
    alloc_locals
    let (input : felt*) = alloc()

    # Address
    assert input[0] = address.elements[0]
    assert input[1] = address.elements[1]
    assert input[2] = address.elements[2]
    assert input[3] = address.elements[3]

    # Storage slot
    assert input[4] = slot.elements[0]
    assert input[5] = slot.elements[1]
    assert input[6] = slot.elements[2]    
    assert input[7] = slot.elements[3]

    let (local keccak_ptr : felt*) = alloc()
    let (out_le) = keccak256{keccak_ptr=keccak_ptr}(input, 64)
    let (key) = swap_endianness_four_words(IntsSequence(out_le, 4, 32))
    return (key)
end

func extract_verification_arguments(proof_ptr : Proof*, proof_type: felt) -> (
        root_hash: IntsSequence,
        proof: IntsSequence*,
        proof_len: felt):
    alloc_locals
    if proof_type == STORAGE:
        let (root) = to_ints_seq(proof_ptr.storage_hash)
        local proof : IntsSequence* = proof_ptr.storage_proof.proof
        local len = proof_ptr.storage_proof_len
        return (root, proof, len)
    end
    ret
end


func hash_eip191_message{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
        message: IntArray) -> (msg_hash : BigInt3):
    alloc_locals
    let (local keccak_ptr : felt*) = alloc()
    let (output_le) = keccak256{keccak_ptr=keccak_ptr}(message.elements, message.byte_len)
    let (output_be) = swap_endianness_four_words(IntsSequence(output_le, 4, 32))
    local output : felt* = output_be.element
    local output_uint : Uint256 = Uint256(
        low=output[2]*2**64 + output[3],
        high=output[0]*2**64 + output[1])
    let (msg_hash) = u256_to_bigint3(output_uint)
    return (msg_hash)
end

func recover_address{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
        msg_hash: BigInt3, r: BigInt3, s: BigInt3, v: felt) -> (address: IntArray):
    alloc_locals

    let (public_key_ec) = recover_public_key(msg_hash, r, s, v-27)

    let (local keccak_ptr : felt*) = alloc()
    let keccak_ptr_start = keccak_ptr
    let (calculated_eth_address : felt) = public_key_point_to_eth_address{
        keccak_ptr=keccak_ptr}(public_key_ec)
    finalize_keccak(keccak_ptr_start=keccak_ptr_start, keccak_ptr_end=keccak_ptr)

    # Convert felt address to IntArray
    let (local elements : felt*) = felt_to_int_array(calculated_eth_address)
    local address : IntArray = IntArray(elements, 4, 32)

    return (address)
end

func verify_storage_proof{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
        proof_ptr : Proof*,
        public_eth_address : felt,
        private_eth_address : IntArray,
        token_balance_min : felt):
    alloc_locals

    # Extract public eth address, storage root, and storage key from signed message contents
    let message = proof_ptr.signature.message
    let (signed_public_eth_address, state_root, storage_key) = extract_message_contents(message)

    # Verify that the claimed public address is in the signed message
    assert signed_public_eth_address = public_eth_address

    # Verify that the signed storage key matches derived trie key
    let storage_slot = proof_ptr.storage_slot
    let (path) = encode_kv_position(storage_slot, private_eth_address)

    # Compare trie path to signed storage key
    let (local storage_key_match: felt) = arr_eq(
        path.element, path.element_size_words,
        storage_key.elements, storage_key.word_len)
    assert storage_key_match = 1

    # Retrieve RLP encoded storage value from proof
    let (root_hash, proof, proof_len) = extract_verification_arguments(proof_ptr, STORAGE)
    let (local keccak_ptr : felt*) = alloc()
    let (path_hash_le) = keccak256{keccak_ptr=keccak_ptr}(path.element, 32)
    let (path_hash_be) = swap_endianness_four_words(IntsSequence(path_hash_le, 4, 32))
    let (local rlp_value: IntsSequence) = verify_proof(path_hash_be, root_hash, proof, proof_len)

    # Decode storage value
    let (local data: IntsSequence) = extract_data{ range_check_ptr = range_check_ptr }(0, 1, rlp_value)
    let storage_value_len = data.element[0] - 128
    let (storage_value) = extractElement(rlp_value, 0)

    # Convert storage value to integer representation
    # Note: this assumes that balance_raw < 2**128
    let (balance_raw) = int_array_to_felt(storage_value.element, storage_value.element_size_words)
    let (den) = pow(2, (32 - 2*storage_value_len)*4)
    let balance = balance_raw / den

    # Check that balance in storage > minimum
    let (res) = is_le(token_balance_min, balance)
    assert res = 1

    return ()
end


func encode_proof_from_json() -> (proof : Proof*):
    alloc_locals

    local public_eth_address : felt
    local token_balance_min : felt
    local block_number : felt

    local storage_proof_len : felt
    local account_address : felt
    local state_root : IntArray 
    local storage_slot : IntArray
    local storage_hash : IntArray

    local message : IntArray
    local r : BigInt3
    local s : BigInt3
    local v : felt

    let (storage_proof0 : IntsSequence*) = alloc()

    local storage_key : IntArray
    local storage_value : IntArray

    %{
        from math import ceil
        from starkware.cairo.common.cairo_secp.secp_utils import split
        
        def pack_intarray(base_addr, hex_input):
            elements = segments.add()
            for j in range(0, len(hex_input) // 16 + 1):
                hex_str = hex_input[j*16 : (j+1) * 16]
                if len(hex_str) > 0:
                    memory[elements + j] = int(hex_str, 16)
            memory[base_addr + ids.IntArray.elements] = elements
            memory[base_addr + ids.IntArray.word_len] = int(ceil(len(hex_input) / 2. / 8))
            memory[base_addr + ids.IntArray.byte_len] = int(len(hex_input) / 2)

        def pack_bigint3(base_addr, input):
            d0, d1, d2 = split(input)
            memory[base_addr + ids.BigInt3.d0] = d0
            memory[base_addr + ids.BigInt3.d1] = d1
            memory[base_addr + ids.BigInt3.d2] = d2

        ids.storage_proof_len = len(program_input['storageProof'][0]['proof'])

        pack_intarray(ids.state_root.address_, program_input['stateRoot'][2:])
        pack_intarray(ids.storage_slot.address_, program_input['storageSlot'][2:])
        pack_intarray(ids.storage_hash.address_, program_input['storageHash'][2:])
        pack_intarray(ids.storage_key.address_, program_input['storageProof'][0]['key'][2:])
        pack_intarray(ids.storage_value.address_, program_input['storageProof'][0]['value'][2:])

        # Storage proof
        for i, proof in enumerate(program_input['storageProof'][0]['proof']):
            base_addr = ids.storage_proof0.address_ + ids.IntsSequence.SIZE * i
            pack_intarray(base_addr, proof[2:])

        # Signature
        pack_intarray(ids.message.address_, program_input['signature']['message'][2:])
        pack_bigint3(ids.r.address_, program_input['signature']['r'])
        pack_bigint3(ids.s.address_, program_input['signature']['s'])
        ids.v = program_input['signature']['v']

        # Contract address
        ids.account_address = int(program_input['address'][2:], 16)

        # Public Ethereum address
        ids.public_eth_address = program_input['publicEthAddress']

        # Minimum token balance
        ids.token_balance_min = program_input['tokenBalanceMin']

        # Block number
        ids.block_number = program_input['blockNumber']
    %}

    local storage_proof : StorageProof = StorageProof(
        key=storage_key, value=storage_value, proof=storage_proof0)
    local signature : Signature = Signature(
        message=message, r=r, s=s, v=v)
    local proof: Proof = Proof(
        public_eth_address=public_eth_address,
        token_balance_min=token_balance_min,
        block_number=block_number,
        account_address=account_address,
        state_root=state_root,
        storage_slot=storage_slot,
        storage_hash=storage_hash,
        storage_proof=storage_proof,
        storage_proof_len=storage_proof_len,
        signature=signature)

    let (__fp__, _) = get_fp_and_pc()
    return (proof=&proof)
end

func serialize_int_array{output_ptr : felt*}(int_array: IntArray):
    serialize_word(int_array.elements[0])
    serialize_word(int_array.elements[1])
    serialize_word(int_array.elements[2])
    serialize_word(int_array.elements[3])
    return () 
end

func main{output_ptr : felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*}():
    alloc_locals
    let (local proof: Proof*) = encode_proof_from_json()

    # Extract Ethereum account address from signed message hash and signature
    let message = proof.signature.message
    let r = proof.signature.r
    let s = proof.signature.s
    let v = proof.signature.v
    let (msg_hash) = hash_eip191_message(message)
    let (private_eth_address) = recover_address(msg_hash, r, s, v)
    let token_balance_min = proof.token_balance_min

    let (__fp__, _) = get_fp_and_pc()

    verify_storage_proof(
        proof_ptr=proof,
        public_eth_address=proof.public_eth_address,
        private_eth_address=private_eth_address,
        token_balance_min=token_balance_min)

    # Serialize the following to output:
    # - Block number
    # - State root hash 
    # - Storage root hash 
    # - Account address 
    # - Public ethereum address
    # - Minimum token balance threshold 
    #
    # Note that block number, state root hash, and account are not checked in
    # this proof in order to keep the proving time and RAM requirements low.
    # The authenticity and relationship between these values can easily be
    # verified offline by downloading the required Merkle proofs from a node.

    serialize_word(proof.block_number)
    serialize_word(proof.account_address)
    serialize_word(proof.public_eth_address)
    serialize_word(proof.token_balance_min)
    serialize_int_array(proof.state_root)
    serialize_int_array(proof.storage_hash)

    return ()
end
