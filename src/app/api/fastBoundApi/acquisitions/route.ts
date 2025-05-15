import { NextResponse } from 'next/server';

const BASE_URL = 'https://cloud.fastbound.com';
const API_KEY = process.env.FASTBOUND_API_KEY;
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER;
const AUDIT_USER = 'sammy@thegunrange.biz'; // Replace with the actual email of a valid FastBound account user

if (!API_KEY || !ACCOUNT_NUMBER) {
  throw new Error('FastBound API key or account number is not set');
}

const rateLimiter = {
  lastRequestTime: 0,
  async limit() {
    const now = Date.now();
    if (now - this.lastRequestTime < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - (now - this.lastRequestTime)));
    }
    this.lastRequestTime = Date.now();
  },
};

const formatContact = (contact: any) => {
  const baseContact = {
    premiseAddress1: contact.premiseAddress1,
    premiseCity: contact.premiseCity,
    premiseState: contact.premiseState,
    premiseZipCode: contact.premiseZipCode,
    premiseCountry: contact.premiseCountry,
    phoneNumber: contact.phoneNumber,
    emailAddress: contact.emailAddress,
  };

  if (contact.fflNumber && contact.fflExpires && contact.licenseName) {
    return {
      ...baseContact,
      fflNumber: contact.fflNumber,
      fflExpires: contact.fflExpires,
      licenseName: contact.licenseName,
      tradeName: contact.tradeName,
      sotein: contact.sotein,
      sotClass: contact.sotClass,
      businessType: contact.businessType,
    };
  } else if (contact.organizationName) {
    return {
      ...baseContact,
      organizationName: contact.organizationName,
    };
  } else if (contact.firstName && contact.lastName) {
    return {
      ...baseContact,
      firstName: contact.firstName,
      lastName: contact.lastName,
      middleName: contact.middleName,
    };
  } else {
    throw new Error('Invalid contact information');
  }
};

async function getContact(contact: any) {
  const searchResponse = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Contacts/Search`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER,
    },
    body: JSON.stringify(formatContact(contact)),
  });

  if (!searchResponse.ok) {
    throw new Error('Failed to search for contact');
  }

  const searchData = await searchResponse.json();
  if (searchData.length > 0) {
    return { id: searchData[0].id, isNew: false };
  }

  // If contact doesn't exist, create a new one
  const createResponse = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER,
    },
    body: JSON.stringify(formatContact(contact)),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create contact');
  }

  const createData = await createResponse.json();
  return { id: createData.id, isNew: true };
}

async function getOrCreateContact(contact: any): Promise<{ id: string; isNew: boolean }> {
  try {
    // Prepare search parameters, only including non-empty values
    const searchParams = new URLSearchParams();
    if (contact.firstName) searchParams.append('firstName', contact.firstName);
    if (contact.lastName) searchParams.append('lastName', contact.lastName);
    if (contact.organizationName) searchParams.append('organizationName', contact.organizationName);
    if (contact.fflNumber) searchParams.append('fflNumber', contact.fflNumber);
    searchParams.append('take', '1'); // We only need one result

    // console.log('Contact search parameters:', searchParams.toString());

    const searchResponse = await fetch(
      `${BASE_URL}/${ACCOUNT_NUMBER}/api/Contacts?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'X-AuditUser': AUDIT_USER,
        },
      }
    );

    const responseText = await searchResponse.text();
    // console.log('Contact search response:', searchResponse.status, responseText);

    if (!searchResponse.ok) {
      if (searchResponse.status === 400) {
        // If it's a 400 error, the contact doesn't exist, so we'll create a new one
        return await createNewContact(contact);
      }
      throw new Error(`Contact search failed: ${searchResponse.status} ${responseText}`);
    }

    let searchData;
    try {
      searchData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error(`Failed to parse contact search response: ${responseText}`);
    }

    if (searchData.contacts && searchData.contacts.length > 0) {
      // Contact exists, return its ID
      return { id: searchData.contacts[0].id, isNew: false };
    }

    // Contact doesn't exist, create a new one
    return await createNewContact(contact);
  } catch (error) {
    console.error('Error in getOrCreateContact:', error);
    throw error;
  }
}

async function createNewContact(contact: any): Promise<{ id: string; isNew: boolean }> {
  // console.log('Creating new contact:', JSON.stringify(contact, null, 2));

  // Prepare the contact object with only the required fields
  const newContact: any = {
    premiseAddress1: contact.premiseAddress1,
    premiseCity: contact.premiseCity,
    premiseState: contact.premiseState,
    premiseZipCode: contact.premiseZipCode,
    premiseCountry: contact.premiseCountry,
  };

  if (contact.fflNumber) {
    // FFL contact
    newContact.fflNumber = contact.fflNumber;
    newContact.fflExpires = contact.fflExpires;
    newContact.licenseName = contact.licenseName;
    newContact.tradeName = contact.tradeName;
  } else if (contact.organizationName) {
    // Organization contact
    newContact.organizationName = contact.organizationName;
  } else {
    // Individual contact
    newContact.firstName = contact.firstName;
    newContact.lastName = contact.lastName;
    if (contact.middleName) newContact.middleName = contact.middleName;
  }

  const createResponse = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER,
    },
    body: JSON.stringify(newContact),
  });

  const createResponseText = await createResponse.text();
  // console.log('Contact creation response:', createResponse.status, createResponseText);

  if (!createResponse.ok) {
    throw new Error(`Contact creation failed: ${createResponse.status} ${createResponseText}`);
  }

  let createData;
  try {
    createData = JSON.parse(createResponseText);
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    throw new Error(`Failed to parse contact creation response: ${createResponseText}`);
  }

  return { id: createData.id, isNew: true };
}

export async function POST(request: Request) {
  try {
    await rateLimiter.limit();

    const requestData = await request.json();
    // console.log('Received data:', JSON.stringify(requestData, null, 2))

    // Get or create contact
    let contact;
    try {
      contact = await getOrCreateContact(requestData.contact);
    } catch (error) {
      console.error('Error getting or creating contact:', error);
      return NextResponse.json(
        { error: 'Failed to process contact', details: (error as Error).message },
        { status: 400 }
      );
    }

    const payload = {
      contactId: contact.id,
      items: requestData.items.map((item: any) => ({
        manufacturer: item.manufacturer,
        countryOfManufacture: item.countryOfManufacture || 'Unknown',
        model: item.model,
        serial: item.serial,
        caliber: item.caliber,
        type: item.type,
        importer: item.importer || null,
        barrelLength: item.barrelLength || null,
        overallLength: item.overallLength || null,
        condition: item.condition || null,
        cost: item.cost ? item.cost.toString() : null,
        price: item.price ? item.price.toString() : null,
        mpn: item.mpn || null,
        upc: item.upc || null,
        sku: item.sku || null,
        location: item.location || null,
      })),
      date: requestData.date,
      type: requestData.type,
      isManufacturingAcquisition: false,
      shipmentTrackingNumber: requestData.trackingNumber || null,
      invoiceNumber: requestData.invoiceNumber || null,
      purchaseOrderNumber: requestData.poNumber || null,
    };

    // console.log('Sending payload to FastBound:', JSON.stringify(payload, null, 2))

    const response = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Acquisitions/CreateAndCommit`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'X-AuditUser': AUDIT_USER,
      },
      body: JSON.stringify(payload),
    });

    // console.log('FastBound API response status:', response.status)
    // console.log('FastBound API response headers:', Object.fromEntries(response.headers))

    if (response.status === 204) {
      // console.log('FastBound API returned 204 No Content - operation successful')
      return NextResponse.json(
        {
          message: 'Acquisition created successfully',
          contactId: contact.id,
          isNewContact: contact.isNew,
        },
        { status: 200 }
      );
    }

    const responseText = await response.text();
    // console.log('FastBound API response text:', responseText)

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from FastBound API', details: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('FastBound API error:', responseData);
      if (responseData && responseData.errors) {
        const errorMessages = responseData.errors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ');
        return NextResponse.json({ error: errorMessages }, { status: response.status });
      }
      return NextResponse.json(
        { error: 'An error occurred while processing your request', details: responseData },
        { status: response.status }
      );
    }

    // console.log('FastBound API success:', responseData)
    return NextResponse.json({
      ...responseData,
      contactId: contact.id,
      isNewContact: contact.isNew,
    });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
