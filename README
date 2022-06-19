#### What is this?

STARK attestations are proofs that the creator held a minimum balance of a token at the end of a given block. Importantly, these tokens may be stored on an anonymous account, but the creator must have the ability to sign messages with that account in order to generate the proof.

Proofs are downloaded from IPFS and verified in browser using the Winterfell codebase.

#### How do I create an attestation?

At the moment, attestations can only be generated through the command line. See the Github repo here for instructions. Proof generation takes around five minutes with a peak RAM consumption of around 12GB on a Macbook M1

#### Are attestations truly private?

The current proofs are not perfect zero-knowledge, and it is possible that information about the address that tokens are held or the exact token balance could be extracted under certain conditions. Correcting this does not meaningfully change proof generation time, and will be added shortly.

#### Is it possible to fake a proof?

Yes! A couple of AIR constraints are not implemented that could be exploited to generate an incorrect proof (although it would be far from trivial). These constraints will be added in shortly.

#### Are proofs trustless?

Yes, the only trust assumption is that the blockhash returned from the Ethereum provider belongs to the claimed block. If you're using your own node, then there is nothing to trust.

#### Can this be used to anonymously prove membership in a DAO, or an NFT collection?

Yes, the Cairo program can be easily modified to prove arbitrary conditions for any storage value.

#### How does it work?

You can read through the balance checker Cairo program here for information (more documentation to come). To confirm that the proof you are viewing corresponds to this particular program, you should check the computed program hash. The correct program hash is 0xcf599536126a617cfcb21610df98c8d08ca668a668b55d3fa9321b89d4504dca (but don't take my word for it -- you can download the code and check for yourself).

#### What are STARKs?

A STARK is a non-interactive proof, and stands for "Scalable Transparent Arguments of Knowledge." You can find more resources about them here

#### What is Cairo?

Cairo is a programming language written for the Cairo VM. Please see the Cairo website here for more information

#### When will this be on chain?

Soon
