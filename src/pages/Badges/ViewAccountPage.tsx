import React from "react"
import Badge from "../../components/Badge/Badge";
import { useParams } from 'react-router-dom';

function AccountID() {
  let params = useParams();
  return params.account
}

const ViewAccountPage = () => {
    return (
      <div>
        <div>
          Viewing badges for account { AccountID() }
        </div>
        <div>
          <Badge
            blockNumber="100"
            stateTrieRoot="100"
            storageTrieRoot="100"
            publicEthereumAddress="0xd42f800D937005a4CE2dFE39D111a71dB1FD6a79"
            tokenContractAddress="0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"
            minTokenBalance="100"
          />
        </div>
      </div>
    )
}

export default ViewAccountPage;
