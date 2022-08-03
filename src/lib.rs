use air::{ProcessorAir, PublicInputs};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use winter_math::StarkField;
use winter_utils::{Deserializable, SliceReader};
use winterfell::StarkProof;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
struct ProofData {
    input_bytes: Vec<u8>,
    proof_bytes: Vec<u8>,
}

#[wasm_bindgen]
pub struct ProofInfo {
    block_number: u64,
    account_address: String,
    public_eth_address: String,
    token_balance_min: String,
    state_root: String,
    storage_root: String,
    program_hash: String,
    security_level: u32,
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn prove() {
    // TODO
}

#[wasm_bindgen]
pub fn verify(buffer: &Uint8Array) -> bool {
    // Load proof and public input data
    let b = buffer.to_vec();
    let data: ProofData = bincode::deserialize(&b).unwrap();
    let pub_inputs = PublicInputs::read_from(&mut SliceReader::new(&data.input_bytes[..])).unwrap();
    let proof = StarkProof::from_bytes(&data.proof_bytes).unwrap();

    // Verify execution
    match winterfell::verify::<ProcessorAir>(proof, pub_inputs) {
        Ok(_) => {
            log("Execution verified");
            true
        }
        Err(err) => {
            log(format!("Failed to verify execution: {}", err).as_str());
            false
        }
    }
}

// TODO: Extract information contained in public input
#[wasm_bindgen]
pub fn get_info(buffer: &Uint8Array) -> ProofInfo {
    // Load public input data
    let b = buffer.to_vec();
    let data: ProofData = bincode::deserialize(&b).unwrap();
    let pub_inputs = PublicInputs::read_from(&mut SliceReader::new(&data.input_bytes[..])).unwrap();
    let mem = pub_inputs.mem;

    // Print everything to console
    //for n in 0..mem.1.len() {
    //    log(format!("{} {}", mem.0[n], mem.1[n].unwrap().word()).as_str());
    //}

    // Compute program hash
    let mut hasher = Sha3_256::new();
    let mut bytes: Vec<u8> = vec![];
    for i in 0..7073 {
        let felt = mem.1[i].unwrap().word();
        bytes.extend(felt.as_int().to_le_bytes());
    }
    hasher.update(&bytes);
    let digest = hasher.finalize();
    let program_hash = hex::encode(digest);

    // Extract claimed block, addresses, and minimum balance
    let block_number: u64 = mem.1[7073].unwrap().word().as_int().try_into().unwrap();
    let account_address = format!("{}", mem.1[7074].unwrap().word());
    let public_eth_address = format!("{}", mem.1[7075].unwrap().word());
    let token_balance_min = format!("{}", mem.1[7076].unwrap().word());

    // Extract claimed Merkle roots
    let state_root = felts_to_hex(&(7077..7081).map(|i| mem.1[i]).collect::<Vec<_>>());
    let storage_root = felts_to_hex(&(7081..7085).map(|i| mem.1[i]).collect::<Vec<_>>());

    // Compute security level
    let proof = StarkProof::from_bytes(&data.proof_bytes).unwrap();
    let security_level = proof.security_level(true);

    return ProofInfo {
        block_number,
        account_address,
        public_eth_address,
        token_balance_min,
        state_root,
        storage_root,
        program_hash,
        security_level,
    };
}

fn felts_to_hex(arr: &[Option<giza_core::Word>]) -> String {
    let mut s = String::new();
    for v in arr {
        s.push_str(
            format!("{}", v.unwrap().word())
                .chars()
                .rev()
                .take(16)
                .into_iter()
                .collect::<Vec<_>>()
                .iter()
                .rev()
                .collect::<String>()
                .as_str(),
        );
    }
    s
}

#[wasm_bindgen]
impl ProofInfo {
    #[wasm_bindgen(getter)]
    pub fn block_number(&self) -> u64 {
        self.block_number
    }
    #[wasm_bindgen(getter)]
    pub fn account_address(&self) -> String {
        self.account_address.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn public_eth_address(&self) -> String {
        self.public_eth_address.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn token_balance_min(&self) -> String {
        self.token_balance_min.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn state_root(&self) -> String {
        self.state_root.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn storage_root(&self) -> String {
        self.storage_root.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn program_hash(&self) -> String {
        self.program_hash.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn security_level(&self) -> u32 {
        self.security_level
    }
}
