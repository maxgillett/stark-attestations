import * as React from "react"
import { hooks } from "../../connectors/metaMask";
import { buildProofInput } from "../../lib/minter";
import { ERC20Proof } from "@vocdoni/storage-proofs-eth";
import * as utils from "web3-utils";

import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Divider from "@mui/material/Divider";

const { useAccounts, useProvider } = hooks;

async function setCurrentBlockNumber(provider, setBlockNumber: any) {
  const n = await provider?.send("eth_blockNumber", []);
  setBlockNumber(n);
}

export default function MintBadgePage() {
  const provider = useProvider();
  const accounts = useAccounts();

  const [keyAddress, setKeyAddress] = React.useState("");
  const [token, setToken] = React.useState("");
  const [blockNumber, setBlockNumber] = React.useState("");
  const [storageSlot, setStorageSlot] = React.useState("");
  const [tokenBalanceMin, setTokenBalanceMin] = React.useState("");

  React.useEffect(() => {
    setCurrentBlockNumber(provider, setBlockNumber);
  });

  const handleChange = (fn) => (event: React.ChangeEvent<HTMLInputElement>) => {
    fn(event.target.value);
  };

  const handleTokenChange = (event: any, newValue: any | null) => {
    if (newValue == null) {
      return;
    }
    const token = newValue.address; //event.target.value;
    setToken(token);
    if (token.length == 40 || token.length == 42) {
      console.log("Setting token storage slot");
      (async () => {
        console.log(token);
        console.log(accounts![0]);
        const slot = await ERC20Proof.findMapSlot(
          token,
          accounts![0],
          provider!
        );
        console.log(slot);
        setStorageSlot(slot);
      })();
    }
  };

  const downloadInput = (data) => {
    const blob = new Blob([data], { type: "text/json" });

    const a = document.createElement("a");
    a.download = "proof.json";
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
  };

  if (!accounts) {
    return <div>Connect wallet to continue</div>;
  }

  return (
    <Box
      margin="50px auto"
      justifyContent="center"
      alignItems="center"
      maxWidth="800px"
    >
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <p>Step 1: Sign and download the proof input</p>
          <p>Step 2: Generate an execution trace from the input</p>
          <p>Step 2: Generate a proof from the trace</p>
        </Grid>
        <Divider
          orientation="vertical"
          flexItem
          style={{ marginRight: "-1px" }}
        />
        <Grid item xs={6}>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            style={{ paddingLeft: "10px" }}
          >
            <div>
              1.
              <FormControl variant="standard">
                <Input
                  id="component-helper"
                  value={utils.hexToNumber(blockNumber)}
                  onChange={handleChange(setBlockNumber)}
                  autoComplete="new-password"
                  aria-describedby="component-helper-text"
                />
                <FormHelperText id="component-helper-text">
                  Block number
                </FormHelperText>
              </FormControl>
            </div>
            <div>
              2.
              <FormControl variant="standard">
                <Input
                  id="component-helper"
                  value={accounts![0]}
                  autoComplete="new-password"
                  aria-describedby="component-helper-text"
                />
                <FormHelperText id="component-helper-text">
                  Wallet address (will not be revealed)
                </FormHelperText>
              </FormControl>
            </div>
            <div>
              3.
              <FormControl variant="standard">
                <Input
                  id="component-helper"
                  value={keyAddress}
                  onChange={handleChange(setKeyAddress)}
                  autoComplete="new-password"
                  aria-describedby="component-helper-text"
                />
                <FormHelperText id="component-helper-text">
                  Creator address (will be revealed)
                </FormHelperText>
              </FormControl>
            </div>
            <div>
              4.
              <FormControl variant="standard">
                <Autocomplete
                  id="component-helper"
                  autoHighlight
                  onChange={handleTokenChange}
                  aria-describedby="component-helper-text"
                  sx={{ width: "300px" }}
                  options={commonTokens}
                  getOptionLabel={(option) => option.address}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      {option.name} - {option.address}
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} variant="standard" />
                  )}
                />
                <FormHelperText id="component-helper-text">
                  Token address
                </FormHelperText>
              </FormControl>
            </div>
            <div>
              5.
              <FormControl variant="standard">
                <Input
                  id="component-helper"
                  value={storageSlot}
                  onChange={handleChange(setStorageSlot)}
                  autoComplete="new-password"
                  aria-describedby="component-helper-text"
                />
                <FormHelperText id="component-helper-text">
                  Storage slot
                </FormHelperText>
              </FormControl>
            </div>
            <div>
              6.
              <FormControl variant="standard">
                <InputLabel htmlFor="component-helper">Balance</InputLabel>
                <Input
                  id="component-helper"
                  value={tokenBalanceMin}
                  onChange={handleChange(setTokenBalanceMin)}
                  autoComplete="new-password"
                  aria-describedby="component-helper-text"
                />
                <FormHelperText id="component-helper-text">
                  Minimum token balance
                </FormHelperText>
              </FormControl>
            </div>
            <Button
              color="inherit"
              style={{ marginTop: "15px" }}
              onClick={() =>
                buildProofInput(
                  provider,
                  keyAddress,
                  accounts![0],
                  token,
                  parseInt(blockNumber),
                  storageSlot,
                  tokenBalanceMin
                ).then((json) => {
                  downloadInput(json);
                })
              }
            >
              Download input
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

const commonTokens = [
  { name: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
  { name: 'ENS', address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72' },
  { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { name: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }
]

//        <Input
//          id="component-helper"
//          value={token}
//          onChange={handleTokenChange}
//          autoComplete="new-password"
//          aria-describedby="component-helper-text"
//        />
