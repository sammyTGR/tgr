// src/app/TGR/certifications/CertificationTable.tsx
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Certification {
  id: string;
  name: string;
  certificate: string;
  number: number;
  expiration: string;
  status: string;
}

const CertificationTable: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fetch-certifications-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageIndex: 0,
            pageSize: 10,
            filters: [],
            sorting: [],
          }),
        });
        const result = await response.json();
        setCertifications(result.data);
      } catch (error) {
        console.error('Error fetching certifications data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatExpirationDate = (date: string) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid Date';
    }
    return format(parsedDate, 'MM-dd-yyyy');
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Certificate</th>
          <th>Number</th>
          <th>Expiration Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {certifications.map((certification) => (
          <tr key={certification.id}>
            <td>{certification.name}</td>
            <td>{certification.certificate}</td>
            <td>{certification.number}</td>
            <td>{formatExpirationDate(certification.expiration)}</td>
            <td>{certification.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CertificationTable;
