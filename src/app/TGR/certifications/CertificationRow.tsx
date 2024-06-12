// src/app/TGR/certifications/CertificationRow.tsx
import React from "react";

interface Certification {
  id: string;
  name: string;
  certificate: string;
  number: number;
  expiration: string;
  status: string;
}

interface CertificationRowProps {
  certification: Certification;
}

const CertificationRow: React.FC<CertificationRowProps> = ({
  certification,
}) => {
  const calculateStatus = (expiration: string) => {
    const expirationDate = new Date(expiration);
    const today = new Date();
    const timeDiff = expirationDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff <= 60 ? "Start Renewal Process" : "";
  };

  return (
    <tr>
      <td>{certification.name}</td>
      <td>{certification.certificate}</td>
      <td>{certification.number}</td>
      <td>{certification.expiration}</td>
      <td>{calculateStatus(certification.expiration)}</td>
    </tr>
  );
};

export default CertificationRow;
