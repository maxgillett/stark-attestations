import React from "react"
import BadgeViewer from "../../components/Badge/Badge";
import { useParams } from 'react-router-dom';

function BadgeID() {
  let params = useParams();
  return params.cid
}

const ViewBadgePage = () => {
  const id = BadgeID();
  return (
    <div style={{ height: 700, width: '100%', padding: 50 }}>
      <BadgeViewer cid={id}  />
    </div>
  )
}

export default ViewBadgePage;
