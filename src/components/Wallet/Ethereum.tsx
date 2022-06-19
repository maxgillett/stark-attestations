import React from "react";
import type { Web3ReactHooks } from '@web3-react/core'
import type { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { useState } from 'react'
import { hooks, metaMask } from '../../connectors/metaMask'
import Button from '@mui/material/Button';

const { useChainId, useAccounts, useError, useIsActivating, useIsActive, useProvider, useENSNames } = hooks

export function Connect({
  connector,
  chainId,
  isActivating,
  error,
  isActive,
}: {
  connector: MetaMask | Network
  chainId: ReturnType<Web3ReactHooks['useChainId']>
  isActivating: ReturnType<Web3ReactHooks['useIsActivating']>
  error: ReturnType<Web3ReactHooks['useError']>
  isActive: ReturnType<Web3ReactHooks['useIsActive']>
}) {
  const isNetwork = connector instanceof Network

  const [desiredChainId, setDesiredChainId] = useState<number>(isNetwork ? 1 : -1)

  if (error) {
    return (
      <Button
        color="inherit"
        onClick={() =>
          connector instanceof Network
            ? connector.activate(desiredChainId === -1 ? undefined : desiredChainId)
            : connector.activate(desiredChainId === -1 ? undefined : desiredChainId)
        }
      >
        Try Again?
      </Button>
    )
  } else if (isActive) {
    return (
      <Button 
        color="inherit"
        onClick={() => connector.deactivate()}>Disconnect Wallet</Button>
    )
  } else {
    return (
      <Button
        variant="outlined"
        color="inherit"
        onClick={
          isActivating
            ? undefined
            : () =>
                connector instanceof Network
                  ? connector.activate(desiredChainId === -1 ? undefined : desiredChainId)
                  : connector.activate(desiredChainId === -1 ? undefined : desiredChainId)
        }
        disabled={isActivating}
      >
        Connect Wallet
      </Button>
    )
  }
}

export default function EthereumWallet(): JSX.Element {
  const chainId = useChainId()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

  return (
    <Connect
      connector={metaMask}
      chainId={chainId}
      isActivating={isActivating}
      error={error}
      isActive={isActive}
    />
  )
}
