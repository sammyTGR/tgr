// TGR/dros/training/dros/dealerhandgun/page.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

const DrosEntrySystem = () => {
  useEffect(() => {
    // Equivalent of `jQuery(document).ready(...)`
    const COMMENT_MAX = 200;

  

    // Back to top button functionality
    const handleScroll = () => {
      const backToTop = document.getElementById('backtotop');
      const jumpToBottom = document.getElementById('jumptobottom');

      if (window.scrollY > 320) {
        if (backToTop) backToTop.style.display = 'block';
        if (jumpToBottom) jumpToBottom.style.display = 'none';
      } else {
        if (backToTop) backToTop.style.display = 'none';
        if (jumpToBottom) jumpToBottom.style.display = 'block';
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const toggleVisibility = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = element.style.display === 'block' ? 'none' : 'block';
    }
  };

  const [formData, setFormData] = useState({
    // Define your form fields here
    purchaserFirstName: '',
    // Add more fields as necessary
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform form validation and submission here
  };

  return (
    <>
      <Head>
        <meta httpEquiv="X-UA-Compatible" content="IE=Edge" />
        <link rel="shortcut icon" href="../images/favicon.ico" />
        <title>DROS Entry System (DES)</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="content-script-type" content="text/javascript" />
        <meta httpEquiv="Content-Style-Type" content="text/css" />
        <meta name="keywords" content="California,Attorney,General,Report,Dealer,Record,Sale,Firearms,Bureau,Firearms" />
        <meta name="description" content="Dealer Record of Sale (DROS) Entry System (DES)" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, height=device-height, user-scalable=yes" />
        <link href="/stylesheets/desStyles.css" rel="stylesheet" type="text/css" media="all" />
        <link href="/stylesheets/print.css" rel="stylesheet" type="text/css" media="print" />
      </Head>

      <div
        id="backtotop"
        style={{
          background: 'rgb(234, 234, 234)',
          margin: '0px 0px 100px',
          border: 'none',
          position: 'fixed',
          zIndex: 500,
          right: '0px',
          padding: '4px 6px 6px 4px',
          textTransform: 'none',
          fontSize: '3em',
          bottom: '0px',
          display: 'none',
        }}
        className="button back-to-top hidebtn"
        onClick={handleScrollToTop}
      >
        <a style={{ color: '#592114', textDecoration: 'none' }} title="Back to Top" href="#">
          <span
            className="tofaq"
            style={{ fontSize: '0.3em', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'none', paddingRight: '2px' }}
          >
            Back to Top
          </span>
          ↑
        </a>
      </div>

      <div
        id="jumptobottom"
        style={{
          background: 'rgb(234, 234, 234)',
          margin: '0px',
          border: 'none',
          position: 'fixed',
          zIndex: 500,
          right: '0px',
          padding: '4px 6px 10px 4px',
          textTransform: 'none',
          fontSize: '3em',
          bottom: '0px',
          display: 'block',
        }}
        className="button"
        onClick={handleScrollToBottom}
      >
        <a style={{ color: '#592114', textDecoration: 'none' }} title="Jump to Bottom" href="#footer">
          <span className="tofaq" style={{ fontSize: '0.3em', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'none', paddingRight: '2px' }}>
            Jump to Bottom
          </span>
          ↓
        </a>
      </div>

      <form id="drosTransactionDto" acceptCharset="UTF-8" onSubmit={handleSubmit} autoComplete="off">
        <div id="sessionAtnMsgId">
          ATTENTION: NAVIGATING AWAY FROM THIS PAGE BEFORE SUBMITTING THE TRANSACTION MAY RESULT IN DATA LOSS.
        </div>
        
        {/* Purchaser Information Fields */}
        <div className="requestSectionContainer">
          <a className="collapseLinkLevel_1" href="#" onClick={() => toggleVisibility('purchaserInfoContainer')}>
            <img id="aiToggle_1_img" src="../images/btnMinus.png" width="9px" height="9px" alt="" />
            &nbsp;Purchaser Information
          </a>
          <div id="purchaserInfoContainer" style={{ display: 'block' }}>
            <input type="hidden" name="transType" value="false" />
            <input type="hidden" name="transCode" value="DHG" />

            <div className="row">
              <label htmlFor="purchaserFirstName">Purchaser First Name</label>
              <input
                id="purchaserFirstName"
                name="purchaserFirstName"
                type="text"
                value={formData.purchaserFirstName || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* Add more fields as per your form structure */}
          </div>
        </div>
        
        {/* More sections and fields as per your form structure */}
      </form>

      <Script src="/javascripts/desScripts.js" strategy="beforeInteractive" />
      <Script src="/javascripts/jqScripts/jquery-3.5.1.min.js" strategy="beforeInteractive" />
      <Script src="/javascripts/jqScripts/jquery.simplemodal-1.4.4.js" strategy="beforeInteractive" />
      <Script src="/javascripts/jqScripts/osx.js" strategy="beforeInteractive" />
      <Script src="/javascripts/jqScripts/vtip.js" strategy="beforeInteractive" />
    </>
  );
};

export default DrosEntrySystem;
