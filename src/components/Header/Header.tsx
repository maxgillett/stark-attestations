import * as React from 'react';
import EthereumWallet from "../Wallet/Ethereum";

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function Header() {
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openFAQ, setOpenFAQ] = React.useState(false);

  const handleClickOpenCreate = () => {
    setOpenCreate(true);
  };

  const handleClickOpenFAQ = () => {
    setOpenFAQ(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
  };

  const handleCloseFAQ = () => {
    setOpenFAQ(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            STARK Attestations
          </Typography>
          <Button color="inherit" onClick={handleClickOpenCreate}>Create attestation</Button>
          <Button color="inherit" onClick={handleClickOpenFAQ}>FAQ</Button>
          <Button color="inherit" href="https://github.com/maxgillett/stark-attestations" target="_blank">Github</Button>
          <EthereumWallet />
        </Toolbar>
      </AppBar>
      <Dialog open={openCreate} onClose={handleCloseCreate}>
        <DialogTitle>Coming soon</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To be notified when in-browser proof generation is available please subscribe below.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancel</Button>
          <Button onClick=
            {(e) => {
              window.location.href = "mailto:max.gillett@gmail.com?subject=STARK Attestations - Proof generation requested";
              e.preventDefault();
              handleCloseCreate()
            }}>Subscribe</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openFAQ} onClose={handleCloseFAQ}>
        <DialogTitle>Frequently Asked Questions</DialogTitle>
        <DialogContent sx={{ maxWidth: 800 }} >
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>What is this?</p>
            <p>STARK attestations are proofs that the creator held a minimum balance of a token at the end of a given block. Importantly, these tokens may be stored on an anonymous account, but the creator must have the ability to sign messages with that account in order to generate the proof.</p>
            <p>Proofs are downloaded from IPFS and verified in browser using the Winterfell codebase.</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>How do I create an attestation?</p>
            <p>At the moment, attestations can only be generated through the command line. See the Github repo <a href="https://github.com/maxgillett/stark-attestations">here</a> for instructions. Proof generation takes around five minutes with a peak RAM consumption of around 12GB on a Macbook M1</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>Are attestations truly private?</p>
            <p>The current proofs are not perfect zero-knowledge, and it is possible that information about the address that tokens are held or the exact token balance could be extracted under certain conditions. Correcting this does not meaningfully change proof generation time, and will be added shortly.</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>Is it possible to fake a proof?</p>
            <p>Yes! A couple of AIR constraints are not implemented that could be exploited to generate an incorrect proof (although it would be far from trivial). These constraints will be added in shortly.</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>Are proofs trustless?</p>
            <p>Yes, the only trust assumption is that the blockhash returned from the Ethereum provider belongs to the claimed block. If you're using your own node, then there is nothing to trust.</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>Can this be used to anonymously prove membership in a DAO, or an NFT collection?</p>
            <p>Yes, the Cairo program can be easily modified to prove arbitrary conditions for any storage value.</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>How does it work?</p>
            <p>You can read through the balance checker Cairo program <a href="https://github.com/maxgillett/stark-attestations/programs/storage_proof.cairo" target="_blank">here</a> for information (more documentation to come). To confirm that the proof you are viewing corresponds to this particular program, you should check the computed program hash. The correct program hash is 0xcf599536126a617cfcb21610df98c8d08ca668a668b55d3fa9321b89d4504dca (but don't take my word for it -- you can download the code and check for yourself).</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>What are STARKs?</p>
            <p>A STARK is a non-interactive proof, and stands for "Scalable Transparent Arguments of Knowledge." You can find more resources about them <a href="https://starkware.co/stark/" target="_blank">here</a> </p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>What is Cairo?</p>
            <p>Cairo is a programming language written for the Cairo VM. Please see the Cairo website <a href="https://www.cairo-lang.org/" target="_blank">here</a> for more information</p>
          </DialogContentText>
          <DialogContentText>
            <p style={{fontWeight: "bold"}}>When will this be on chain?</p>
            <p>Soon</p>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
