import click
import os, json
from dotenv import load_dotenv
from web3 import Web3
from eth_account.messages import encode_defunct

@click.command()
@click.option('--block_number', default=14987112)
@click.option('--token_address', default='0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72')
@click.option('--token_balance_min', default=150000000000000000000)
@click.option('--public_eth_address')
@click.option('--private_eth_address')
@click.option('--rpc_http')
def create_proof_data(
        block_number,
        token_address,
        token_balance_min,
        public_eth_address,
        private_eth_address,
        rpc_http):

    load_dotenv()
    w3 = Web3(Web3.HTTPProvider(rpc_http))
    
    # Create storage proof for an ERC20 balance at a particular block number
    slot = str(0).rjust(64, '0')
    key = private_eth_address[2:].rjust(64, '0').lower()
    position = w3.keccak(hexstr=key + slot)
    block = w3.eth.get_block(block_number)
    proof = w3.eth.get_proof(token_address, [position], block_number)
    balance = w3.eth.get_storage_at(token_address, position)
    print("Generating proof of balance", Web3.toInt(balance))
    
    # Sign a message demonstrating control over the storage slot
    # Pad the message with zeros to align 64bit word size in Cairo
    state_root = block.stateRoot.hex()
    storage_key = proof['storageProof'][0]['key'].hex()[2:]
    msg = "000000000000000000000000000000%s%s%s00000000" % ( 
        public_eth_address[2:],
        state_root[2:],
        storage_key)
    message = encode_defunct(hexstr=msg)
    signed_message = w3.eth.account.sign_message(message, private_key=os.environ['PRIVATE_KEY'])
    eip191_message = b'\x19' + message.version + message.header + message.body
    
    print(message.body.hex()[6:])
    print(eip191_message.hex())
    
    # Serialize proof to disk
    proof_dict = json.loads(Web3.toJSON(proof))
    proof_dict['blockNumber'] = block_number
    proof_dict['publicEthAddress'] = int(public_eth_address, 16)
    proof_dict['tokenBalanceMin'] = token_balance_min
    proof_dict['stateRoot'] = state_root
    proof_dict['storageSlot'] = slot
    proof_dict["signature"] = {
        "message": "0x"+eip191_message.hex(),
        "messageHash": signed_message.messageHash.hex(),
        "r": signed_message.r,
        "s": signed_message.s,
        "v": signed_message.v,
    }
    json.dump(proof_dict, open("proof.json", "w"), indent=4)

if __name__ == '__main__':
    create_proof_data()
