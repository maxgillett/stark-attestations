import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import {
    BrowserRouter as Router,
    Link,
} from "react-router-dom";

function createData(
  account: string,
  dao: number,
  token: number,
  nft: number,
  other: number,
) {
  return { account, dao, token, nft, other };
}

const rows = [
  createData('0x0000000000000...', 0, 0, 0, 0),
  createData('twitter: maxgillett', 1, 1, 1, 0),
];

export default function DenseTable() {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 250 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell width="10px" align="center">DAO</TableCell>
            <TableCell width="10px" align="center">Token</TableCell>
            <TableCell width="10px" align="center">NFT</TableCell>
            <TableCell width="10px" align="center">Other</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow 
              component={Link} to={`/view/account/${row.account}/`}
              key={row.account}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.account}
              </TableCell>
              <TableCell align="center">{row.dao}</TableCell>
              <TableCell align="center">{row.token}</TableCell>
              <TableCell align="center">{row.nft}</TableCell>
              <TableCell align="center">{row.other}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
