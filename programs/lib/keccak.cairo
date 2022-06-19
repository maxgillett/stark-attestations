from lib.packed_keccak import BLOCK_SIZE, packed_keccak_func
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin
from starkware.cairo.common.math import assert_nn_le, unsigned_div_rem
from starkware.cairo.common.memset import memset
from starkware.cairo.common.pow import pow

const KECCAK_STATE_SIZE_FELTS = 25

# Computes the keccak of 'input'. Inputs of up to 127 bytes are supported.
# To use this function, split the input into (up to) 16 words of 64 bits (little endian).
# For example, to compute keccak('Hello world!'), use:
#   input = [8031924123371070792, 560229490]
# where:
#   8031924123371070792 == int.from_bytes(b'Hello wo', 'little')
#   560229490 == int.from_bytes(b'rld!', 'little')
#
# output is an array of 4 64-bit words (little endian).
#
# Assumption: n_bytes <= 127.
#
# Note: You must call finalize_keccak() at the end of the program. Otherwise, this function
# is not sound and a malicious prover may return a wrong result.
# Note: the interface of this function may change in the future.
func keccak{range_check_ptr, keccak_ptr : felt*}(input : felt*, n_bytes : felt) -> (output : felt*):
    assert_nn_le(n_bytes, 127)
    let keccak_ptr_start = keccak_ptr
    _keccak_input(input=input, n_bytes=n_bytes, n_words=16)
    assert keccak_ptr[0] = 2 ** 63
    assert keccak_ptr[1] = 0
    assert keccak_ptr[2] = 0
    assert keccak_ptr[3] = 0
    assert keccak_ptr[4] = 0
    assert keccak_ptr[5] = 0
    assert keccak_ptr[6] = 0
    assert keccak_ptr[7] = 0
    assert keccak_ptr[8] = 0
    let keccak_ptr = keccak_ptr + 9

    let output = keccak_ptr
    %{
        from starkware.cairo.common.cairo_keccak.keccak_utils import keccak_func
        _keccak_state_size_felts = int(ids.KECCAK_STATE_SIZE_FELTS)
        assert 0 <= _keccak_state_size_felts < 100
        output_values = keccak_func(memory.get_range(
            ids.keccak_ptr_start, _keccak_state_size_felts))
        segments.write_arg(ids.output, output_values)
    %}
    let keccak_ptr = keccak_ptr + KECCAK_STATE_SIZE_FELTS
    return (output)
end

func _keccak_input{range_check_ptr, keccak_ptr : felt*}(
        input : felt*, n_bytes : felt, n_words : felt):
    alloc_locals

    local full_word
    %{ ids.full_word = int(ids.n_bytes >= 8) %}

    if full_word != 0:
        assert keccak_ptr[0] = input[0]
        let keccak_ptr = keccak_ptr + 1
        return _keccak_input(input=input + 1, n_bytes=n_bytes - 8, n_words=n_words - 1)
    else:
        if n_bytes == 0:
            assert keccak_ptr[0] = 1
            memset(dst=keccak_ptr + 1, value=0, n=n_words - 1)
            let keccak_ptr = keccak_ptr + n_words
            return ()
        end

        assert_nn_le(n_bytes, 7)
        let (padding) = pow(256, n_bytes)
        local range_check_ptr = range_check_ptr

        assert keccak_ptr[0] = input[0] + padding

        memset(dst=keccak_ptr + 1, value=0, n=n_words - 1)
        let keccak_ptr = keccak_ptr + n_words
        return ()
    end
end

# Handles n blocks of BLOCK_SIZE keccak instances.
func _finalize_keccak_inner{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(
        keccak_ptr : felt*, n : felt):
    if n == 0:
        return ()
    end

    alloc_locals

    local MAX_VALUE = 2 ** 64 - 1

    let keccak_ptr_start = keccak_ptr

    let (local inputs_start : felt*) = alloc()

    # Handle inputs.

    tempvar inputs = inputs_start
    tempvar keccak_ptr = keccak_ptr
    tempvar range_check_ptr = range_check_ptr
    tempvar m = 25

    input_loop:
    tempvar x0 = keccak_ptr[0]
    assert [range_check_ptr] = x0
    assert [range_check_ptr + 1] = MAX_VALUE - x0
    tempvar x1 = keccak_ptr[50]
    assert [range_check_ptr + 2] = x1
    assert [range_check_ptr + 3] = MAX_VALUE - x1
    tempvar x2 = keccak_ptr[100]
    assert [range_check_ptr + 4] = x2
    assert [range_check_ptr + 5] = MAX_VALUE - x2
    assert inputs[0] = x0 + 2 ** 64 * x1 + 2 ** 128 * x2

    tempvar inputs = inputs + 1
    tempvar keccak_ptr = keccak_ptr + 1
    tempvar range_check_ptr = range_check_ptr + 6
    tempvar m = m - 1
    jmp input_loop if m != 0

    # Run keccak on the 3 instances.

    let (outputs) = packed_keccak_func(inputs_start)
    local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr

    # Handle outputs.

    tempvar outputs = outputs
    tempvar keccak_ptr = keccak_ptr
    tempvar range_check_ptr = range_check_ptr
    tempvar m = 25

    output_loop:
    tempvar x0 = keccak_ptr[0]
    assert [range_check_ptr] = x0
    assert [range_check_ptr + 1] = MAX_VALUE - x0
    tempvar x1 = keccak_ptr[50]
    assert [range_check_ptr + 2] = x1
    assert [range_check_ptr + 3] = MAX_VALUE - x1
    tempvar x2 = keccak_ptr[100]
    assert [range_check_ptr + 4] = x2
    assert [range_check_ptr + 5] = MAX_VALUE - x2
    assert outputs[0] = x0 + 2 ** 64 * x1 + 2 ** 128 * x2

    tempvar outputs = outputs + 1
    tempvar keccak_ptr = keccak_ptr + 1
    tempvar range_check_ptr = range_check_ptr + 6
    tempvar m = m - 1
    jmp output_loop if m != 0

    return _finalize_keccak_inner(keccak_ptr=keccak_ptr_start + 150, n=n - 1)
end

# Verifies that the results of keccak() are valid.
func finalize_keccak{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(
        keccak_ptr_start : felt*, keccak_ptr_end : felt*):
    alloc_locals

    tempvar n = (keccak_ptr_end - keccak_ptr_start) / (2 * KECCAK_STATE_SIZE_FELTS)
    if n == 0:
        return ()
    end

    %{
        # Add dummy pairs of input and output.
        _keccak_state_size_felts = int(ids.KECCAK_STATE_SIZE_FELTS)
        _block_size = int(ids.BLOCK_SIZE)
        assert 0 <= _keccak_state_size_felts < 100
        assert 0 <= _block_size < 1000
        inp = [0] * _keccak_state_size_felts
        padding = (inp + keccak_func(inp)) * _block_size
        segments.write_arg(ids.keccak_ptr_end, padding)
    %}

    # Compute the amount of blocks (rounded up).
    let (local q, r) = unsigned_div_rem(n + BLOCK_SIZE - 1, BLOCK_SIZE)
    _finalize_keccak_inner(keccak_ptr_start, n=q)
    return ()
end
