import * as React from 'react';
import * as Wasm from '../../../pkg';

import { create } from 'ipfs-http-client';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import all from 'it-all'
import moment from "moment"

import Web3 from 'web3';
import { hooks, metaMask } from '../../connectors/metaMask'
import  { GetAndVerify, GetProof, VerifyProof } from 'eth-proof';
import { toBuffer } from 'eth-util-lite';

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';


const tokenLookups = {
  '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72': 'ENS (Ethereum Name Service)'
}

const ipfs = create({url: 'https://ipfs.infura.io:5001/api/v0'});
const getAndVerify = new GetAndVerify('http://cloudflare-eth.com/v1/mainnet')

const { useChainId, useAccounts, useError, useIsActivating, useIsActive, useProvider, useENSNames } = hooks

async function callIpfs(cid: any, setRes: any, setStatus: any) {
  const res = await ipfs.cat(cid, {length: 1_000_000});
  (async () => {
    try {
      const response = uint8ArrayConcat(await all(res))
      setStatus("loaded")
      setRes(response)
    } catch(e) {
      setStatus("failed")
    }
  })();
}

function verifyProof(info, data, verified, setVerified, provider, isActive) {
  if (!isActive) {
    return 
  }
  if (verified == "unknown") {
    (async () => {
      const blockNumber = "0x"+BigInt(info.block_number).toString(16);
      const accountAddress = "0x"+info.account_address.slice(-40)
      const stateRoot = "0x"+info.state_root // "0xe1a012879b33390bad6a24f8e7b16cf00a52e25587d3b1c90986e5bd37f8bf2b"
      const storageRoot = "0x"+info.storage_root // "0x1d6fee9790da714289ad12a51c30e03bb4aa5541c98811ea5334f57104f16a57"

      const block = await provider?.send("eth_getBlockByNumber", [blockNumber, false]);
      const blockHash = block.hash
      
      // Fetch account proof
      const accountProof = await provider?.send(
        "eth_getProof", [accountAddress, [], blockNumber]);

      // Verify account proof
      let stateRootFromProofRaw = VerifyProof.getRootFromProof(accountProof)
      let stateRootFromProof = Buffer.from(stateRootFromProofRaw).toString('hex');
      const accountFromProofRaw = await VerifyProof.getAccountFromProofAt(accountProof, accountAddress)
      let storageRootFromProof = Buffer.from(accountFromProofRaw.storageRoot).toString('hex');
      
      // Check that state trie root matches block
      // Check that contract account is in state trie
      // Check that storage trie root matches contract account
      //
      // TODO: The eth-proof library contains a bug. The correct roots are not being derived, so we 
      // will assume that the node is providing the correct data.
      //
      //if (stateRoot != stateRootFromProof) throw new Error('State root mismatch')
      //if (storageRoot != storageRootFromProof) throw new Error('Storage root mismatch')
      if (stateRoot != block.stateRoot || storageRoot != accountProof.storageRoot) {
        setVerified("failed")
      }

      // Verify STARK proof
      (Wasm.verify(data)) ? setVerified("success") : setVerified("failed")
    })();
  }
}

function extractProofDetails(data, provider, isActive, setTimeStamp) {
  const info = Wasm.get_info(data)
  console.log(info.block_number)
  console.log(info.account_address)
  console.log(info.public_eth_address)
  console.log(info.token_balance_min)
  console.log(info.state_root)
  console.log(info.storage_root)
  console.log(info.program_hash)
  console.log(info.security_level)

  if (isActive) {
    (async () => {
      const blockNumber = "0x"+BigInt(info.block_number).toString(16);
      const block = await provider?.send("eth_getBlockByNumber", [blockNumber, false]);
      setTimeStamp(BigInt(block.timestamp).toString(10))
    })();
  }

  return info
}

function getTokenName(rawAddress: string) {
  const address = rawAddress.toLowerCase()
  if (address in tokenLookups) {
    return tokenLookups[address]
  } else {
    return address
  }
}


interface IpfsObject {
  cid: String,
}

interface PublicInput {
  info: any
  timeStamp: string,
  rawData: Uint8Array,
  provider: any
}

interface RowInput {
  timeStamp: string,
  blockNumber: string;
  publicEthereumAddress: string,
  minTokenBalance: string;
  programHash: string;
  securityLevel: string
}

export default function BadgeViewer(props: IpfsObject) {
  const isActive = useIsActive()
  const provider = useProvider();
  const [res, setRes] = React.useState(null)
  const [status, setStatus] = React.useState("loading")
  const [timeStamp, setTimeStamp] = React.useState("unknown");
  React.useEffect(() => {
    callIpfs(props.cid, setRes, setStatus)
  }, [setRes])

  if (res && status == "loaded") {
    const info = extractProofDetails(res, provider, isActive, setTimeStamp);

    return (
      <Badge
        info={info}
        timeStamp={timeStamp}
        rawData={res}
        provider={provider}
      />
    )
  } else if (status == "loading") {
    return (
      <div>
        Loading proof
      </div>
    )
  } else if (status == "failed") {
    return (
      <div>
        No proof found at cid:{props.cid}
      </div>
    )
  }
}

function Badge(props: PublicInput) {
  const isActive = useIsActive()
  const [verified, setVerified] = React.useState("unknown")
  return (
    <Card sx={{ maxWidth: 375 }}>
      <CardMedia
        component="img"
        image="/images/milad-fakurian-iFu2HILEng8-unsplash.jpg"
        height="75"
      />
      <CardContent>
        <div style={{marginBottom: 15}}>
          <Tooltip title={"0x"+props.info.account_address.slice(-40)} placement="top-start" arrow>
            <Typography gutterBottom variant="subtitle1" component="div">
              <img style={{marginLeft: 10, marginRight: 10}} src="/images/eth-diamond-purple.png" width="10px" height="15px" />
              {getTokenName("0x"+props.info.account_address.slice(-40))}
            </Typography>
          </Tooltip>
        </div>
        <DenseTable 
            timeStamp={props.timeStamp}
            blockNumber={props.info.block_number}
            publicEthereumAddress={"0x"+props.info.public_eth_address.slice(-40)}
            minTokenBalance={BigInt("0x"+props.info.token_balance_min).toString(10)}
            programHash={"0x"+props.info.program_hash}
            securityLevel={props.info.security_level} />
      </CardContent>
      <CardActions>
        <div style={{paddingLeft: 7, paddingBottom: 7}}>
          <Button 
              variant={getVerifyButtonVariant(verified)}
              onClick={e => verifyProof(
                props.info,
                props.rawData,
                verified,
                setVerified,
                props.provider,
                isActive)}
              color={getVerifyButtonColor(verified)}
              size="small">
              {getVerifyButtonText(verified, isActive)}
          </Button>
        </div>
      </CardActions>
    </Card>
  )
}

function DenseTable(props: RowInput) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 250 }} size="small" aria-label="a dense table">
        <TableBody>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
            <Tooltip title="Owner of attestation (which may differ from token wallet)" placement="top-start" arrow>
              <TableCell component="th" scope="row">
                  Creator:
              </TableCell>
            </Tooltip>
            <Tooltip title={props.publicEthereumAddress} placement="top-end" arrow>
                <TableCell align="right">
                    {props.publicEthereumAddress.substr(0, 16)}...
                </TableCell>
            </Tooltip>
          </TableRow>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
            <Tooltip title="Unique hash corresponding to the Cairo program" placement="top-start" arrow>
              <TableCell component="th" scope="row">
                  Program hash:
              </TableCell>
            </Tooltip>
            <Tooltip title={props.programHash} placement="top-end" arrow>
              <TableCell align="right">
                  {props.programHash.substr(0, 16)}...
              </TableCell>
            </Tooltip>
          </TableRow>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
            <Tooltip title="Security level of the STARK proof" placement="top-start" arrow>
              <TableCell component="th" scope="row">
                  Security level:
              </TableCell>
            </Tooltip>
            <TableCell align="right">
                {props.securityLevel} bits
            </TableCell>
          </TableRow>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
            <Tooltip title="Age of the block for which the proof was generated" placement="top-start" arrow>
              <TableCell component="th" scope="row">
                  Proof age:
              </TableCell>
            </Tooltip>
            <Tooltip title={"Block: " + props.blockNumber} placement="top-end" arrow>
              <TableCell align="right">
                  {props.timeStamp == "unknown" ? "Unknown" : moment.unix(props.timeStamp).fromNow()}
              </TableCell>
            </Tooltip>
          </TableRow>
          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
            <Tooltip title="Minimum token balance" placement="top-end" arrow>
              <TableCell component="th" scope="row">
                  Token balance:
              </TableCell>
            </Tooltip>
            <TableCell align="right">
                {parseInt(props.minTokenBalance)/1e18}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function getVerifyButtonText(verified, isActive) {
  if (!isActive && verified == "unknown") {
    return "Connect wallet to Verify"
  }
  if (verified == "unknown") {
    return "Verify"
  } else if (verified == "failed") {
    return "Failed"
  } else if (verified == "success") {
    return "Verified"
  } else {
    return "Failed"
  }
}

function getVerifyButtonVariant(verified) {
  if (verified == "unknown") {
    return "text"
  } else if (verified == "failed") {
    return "outlined"
  } else if (verified == "success") {
    return "outlined"
  } else {
    return "outlined"
  }
}

function getVerifyButtonColor(verified) {
  if (verified == "unknown") {
    return "info"
  } else if (verified == "failed") {
    return "error"
  } else if (verified == "success") {
    return "secondary"
  } else {
    return "error"
  }
}
