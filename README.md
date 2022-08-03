## Overview
STARK attestations are proofs that the creator held a minimum balance of a token at the end of a given block. Importantly, these tokens may be stored on an anonymous account, but the creator must have the ability to sign messages with that account in order to generate the proof. Proofs are downloaded from IPFS and verified in browser using the Winterfell codebase.

Try it here: [https://stark-attestations.netlify.app/view/badge/QmUj7cwrY6FqxSHvwN5oAh4yb3xTZu2v3g4yrBFCSQQ3U6](https://stark-attestations.netlify.app/view/badge/QmUj7cwrY6FqxSHvwN5oAh4yb3xTZu2v3g4yrBFCSQQ3U6)

## Create an attestation
Proof generation takes around five minutes with a peak RAM consumption of around 12GB on a Macbook M1.

You'll need to have the following already installed:
- Nightly version of Rust
- A Cairo runner

**Install Giza**
1. `git clone https://github.com/maxgillett/giza`
2. `cd giza`
3. `cargo install --path cli`

**Build proof data**
1. `git clone https://github.com/maxgillett/stark-attestations`
2. `cd stark-attestations`
3. Run `python cli/cli.py` with the provided arguments

**Generate the proof**
1. `cd stark-attestations/programs`
2. Compile and run the Cairo program: `./compile_and_run.sh`
3. `giza prove --program=storage_proof.json --trace=trace.bin --memory=memory.bin --output=output.bin --num-outputs=12`

**Share the proof**
1. Upload `output.bin` to IPFS, and note the returned CID (content identifier)
2. Navigate to `https://stark-attestations.netlify.app/view/badge/{CID}`, replacing your CID

## FAQ

#### Are attestations truly private?
The current proofs are not perfect zero-knowledge, and it is possible that information about the address that tokens are held or the exact token balance could be extracted under certain conditions. Correcting this does not meaningfully change proof generation time, and will be added shortly.

#### Is it possible to fake a proof?
Yes! A couple of AIR constraints are not implemented that could be exploited to generate an incorrect proof (although it would be far from trivial). These constraints will be added in shortly.

#### Are proofs trustless?
Yes, the only trust assumption is that the blockhash returned from the Ethereum provider belongs to the claimed block. If you're using your own node, then there is nothing to trust.

#### Can this be used to anonymously prove membership in a DAO, or an NFT collection?
Yes, the Cairo program can be easily modified to prove arbitrary conditions for any storage value.

#### How does it work?
You can read through the balance checker Cairo program [here](https://github.com/maxgillett/stark-attestations/blob/master/programs/storage_proof.cairo) for information (more documentation to come). To confirm that the proof you are viewing corresponds to this particular program, you should check the computed program hash. The program hash corresponding to `storage_proof.cairo` is `0xcf599536126a617cfcb21610df98c8d08ca668a668b55d3fa9321b89d4504dca` (but don't take my word for it -- you can download the code and check for yourself).

#### What are STARKs?
A STARK is a non-interactive proof, and stands for "Scalable Transparent Arguments of Knowledge." You can find more resources about them [here](https://starkware.co/stark/).

#### What is Cairo?
Cairo is a programming language written for the Cairo VM. Please see the [Cairo website](https://www.cairo-lang.org/) for more information.

## Known issues
- When first loading the web app there may be an race condition causing the "Connect Wallet" button to be grayed out. This can be resolved by refreshing the page multiple times.

## Acknowledgments
- The L1 state verification library is derived from the [Fossil](https://github.com/OilerNetwork/fossil) library built by [@marcellobardus](https://github.com/marcellobardus) and team at OilerNetwork.
- The STARK prover and verifier is built using the [Winterfell](https://github.com/novifinancial/winterfell) project.
- The Cairo virtual machine and programming language is developed by [Starkware](https://starkware.co/).
