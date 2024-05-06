// components/ui/supportmenutest.tsx
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from "react";
import styled from 'styled-components';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IDsCard = dynamic(() => import('../../app/audits/Cards/IDsCard'), { ssr: false });
const FedsCard = dynamic(() => import('../../app/audits/Cards/FedsCard'), { ssr: false });
const FedLimits = dynamic(() => import('../../app/audits/Cards/FedLimits'), { ssr: false });
const FedLimsName = dynamic(() => import('../../app/audits/Cards/FedLimsName'), { ssr: false });
const ProofDocs = dynamic(() => import('../../app/audits/Cards/ProofDocs'), { ssr: false });
const CorrectionDocs = dynamic(() => import('../../app/audits/Cards/CorrectionDocs'), { ssr: false });
const DelayedDeliveries = dynamic(() => import('../../app/audits/Cards/DelayedDeliveries'), { ssr: false });
const LeoPPT = dynamic(() => import('../../app/audits/Cards/LeoPPT'), { ssr: false });
const PeaceOfficer = dynamic(() => import('../../app/audits/Cards/PeaceOfficerDROS'), { ssr: false });
const ReserveOfficer = dynamic(() => import('../../app/audits/Cards/ReserveOfficer'), { ssr: false });
const FederalAgent = dynamic(() => import('../../app/audits/Cards/FederalAgent'), { ssr: false });
const ActiveDuty = dynamic(() => import('../../app/audits/Cards/ActiveDuty'), { ssr: false });
const LocalActive = dynamic(() => import('../../app/audits/Cards/LocalActive'), { ssr: false });
const RetiredMilitary = dynamic(() => import('../../app/audits/Cards/RetiredMilitary'), { ssr: false });
const InterimDl = dynamic(() => import('../../app/audits/Cards/InterimDl'), { ssr: false });
const PeaceOfficerDROS = dynamic(() => import('../../app/audits/Cards/PeaceOfficer'), { ssr: false });
const ReserveInfo = dynamic(() => import('../../app/audits/Cards/ReserveInfo'), { ssr: false });
const FedsAgentLeo = dynamic(() => import('../../app/audits/Cards/FedsAgentLeo'), { ssr: false });
const PartiucularLimDROS = dynamic(() => import('../../app/audits/Cards/PartiucularLimDROS'), { ssr: false });
const SecurityGuards = dynamic(() => import('../../app/audits/Cards/SecurityGuards'), { ssr: false });
const FFL03COE = dynamic(() => import('../../app/audits/Cards/FFL03COE'), { ssr: false });
const ConsignRedemp = dynamic(() => import('../../app/audits/Cards/ConsignRedemp'), { ssr: false });
const AmmoPurchase = dynamic(() => import('../../app/audits/Cards/AmmoPurchase'), { ssr: false });
const RegisteredAlien = dynamic(() => import('../../app/audits/Cards/RegisteredAlien'), { ssr: false });
const StudentVISA = dynamic(() => import('../../app/audits/Cards/StudentVISA'), { ssr: false });
const WorkVISA = dynamic(() => import('../../app/audits/Cards/WorkVISA'), { ssr: false });
const EmpAuth = dynamic(() => import('../../app/audits/Cards/EmpAuth'), { ssr: false });
const PendingResident = dynamic(() => import('../../app/audits/Cards/PendingResident'), { ssr: false });
// Add other imports as needed

// Styled components
const SubItemsContainer = styled.div`
  position: absolute;
  display: none; // Initially hidden
  grid-template-columns: repeat(3, 2fr);
  gap: 8px;
  padding: 8px;
  background: none; // Background color for the sub-items container
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); // Optional: shadow for the sub-items container
  z-index: 30; // Ensure it's above other content
  min-width: 300px;
  white-space: nowrap;
`;

const DialogContainer = styled.div`
  position: absolute;
  padding: 10px;
  background-color: none;
  border: none;
  z-index: 100; // Ensure the dialog is above other content
  // Additional styling as needed
`;

// Close Button - Styled component for the close button
const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  // Style your close button as needed
`;

const LineSeparator = styled.div`
  height: 1px;
  background-color: #ccc;
  width: 100%;
  margin: 8px 0;
`;

const colorMapping = {
    "Special": "#f00", // Red
    "Important": "#00f", // Blue
    "Note": "#0f0", // Green
    // Add more mappings as needed
  };

  const applyColorToLabel = (label: string) => {
    // function body
  
    const keywords = Object.keys(colorMapping);
    const foundKeyword = keywords.find(keyword => label.includes(keyword));
  
    if (foundKeyword) {
      const parts = label.split(foundKeyword);
      const ColorStyledText = styled.span`
      colorMapping[foundKeyword as keyof typeof colorMapping]
        font-weight: bold; // Optional styling
      `;
  
      return (
        <>
          {parts[0]}
          <ColorStyledText>{foundKeyword}</ColorStyledText>
          {parts.slice(1).join(foundKeyword)}
        </>
      );
    }
  
    // Return the label as is if no keywords are found
    return label;
  };

  
type SubItem = {
  label: string;
  contentId: string;
  link: string;
};

type MenuItem = {
  label: string;
  dialogId: string;
  subItems: SubItem[];
};

const dialogContentComponents = {
  IDsCard: <IDsCard />,
  FedsCard: <FedsCard />,
  FedLimits: <FedLimits />,
  FedLimsName: <FedLimsName />,
  ProofDocs: <ProofDocs />,
  CorrectionDocs: <CorrectionDocs />,
  DelayedDeliveries: <DelayedDeliveries />,
  LeoPPT: <LeoPPT />,
  PeaceOfficer: <PeaceOfficer />,
  ReserveOfficer: <ReserveOfficer />,
  FederalAgent: <FederalAgent />,
  ActiveDuty: <ActiveDuty />,
  LocalActive: <LocalActive />,
  RetiredMilitary: <RetiredMilitary />,
  InterimDl: <InterimDl />,
  PeaceOfficerDROS: <PeaceOfficerDROS />,
  ReserveInfo: <ReserveInfo />,
  FedsAgentLeo: <FedsAgentLeo />,
  PartiucularLimDROS: <PartiucularLimDROS />,
  SecurityGuards: <SecurityGuards />,
  FFL03COE: <FFL03COE />,
  ConsignRedemp: <ConsignRedemp />,
  AmmoPurchase: <AmmoPurchase />,
  RegisteredAlien: <RegisteredAlien />,
  StudentVISA: <StudentVISA />,
  WorkVISA: <WorkVISA />,
  EmpAuth: <EmpAuth />,
  PendingResident: <PendingResident />,
  // Add other mappings as necessary
};

const SupportMenu = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const dialogRef = useRef<HTMLDivElement>(null);
    const [activeDialogContent, setActiveDialogContent] = useState<React.ReactNode | null>(null);
    const [activeDialog, setActiveDialog] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
      const fetchMenuItems = async () => {
        let { data, error } = await supabase
          .from('Navmenuoptions')
          .select('*');
    
        if (error) {
          console.error('Failed to fetch menu items:', error.message);
          return;
        }
    
        if (data) {
          const itemsMap = new Map();
          data.forEach((item: any) => {
            const { menu_item, subitem_label, card_names } = item;
            if (!itemsMap.has(menu_item)) {
              itemsMap.set(menu_item, { label: menu_item, subItems: [] });
            }
            const menuItem = itemsMap.get(menu_item);
            if (subitem_label && card_names) { // Only add subItems that have valid labels and contentIds
              menuItem.subItems.push({ label: subitem_label, contentId: card_names, link: '' }); // Assuming 'link' might be used later or is part of your model
            }
          });
    
          setMenuItems(Array.from(itemsMap.values()));
          // console.log("Menu items set:", Array.from(itemsMap.values())); // Check the structured menu items
        } else {
          console.error('No data available');
        }
      };
    
      if (typeof window !== 'undefined') {
        fetchMenuItems();
      }
    }, []);

    // Close active dialog
    const closeDialog = () => setActiveDialog(null);

    // Render dialog content based on the active dialog
    const renderDialogContent = () => {
      if (!activeDialog) return null;
      const ContentComponent = dialogContentComponents[activeDialog];
      return (
        <DialogContainer ref={dialogRef}>
          {ContentComponent}
          <CloseButton onClick={closeDialog}>Close</CloseButton>
        </DialogContainer>
      );
    };

  const handleSubItemClick = (contentId: string) => {
    const contentComponent = dialogContentComponents[contentId as keyof typeof dialogContentComponents];
    if (contentComponent) {
      setActiveDialogContent(contentComponent);
    } else {
      console.error("Content not found for id:", contentId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setActiveDialogContent(null); // Hide active dialog content
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setSubItemsDisplay = (index: number, displayType: 'grid' | 'none') => {
    const subitemsElement = document.getElementById(`subitems-${index}`);
    if (subitemsElement) {
      subitemsElement.style.display = displayType;
    }
  };

  // Define a component to render subitem labels with styles
  const StyledSubItemLabel = ({ label }: { label: string }) => {
    // Simple parser to replace [color] tags with styled spans
    const parsedLabel = label.replace(/\[(.*?)\](.*?)\[\/\1\]/g, (match, p1, p2) => {
      return `<span style="color: ${p1};">${p2}</span>`;
    });
  
    return <span dangerouslySetInnerHTML={{ __html: parsedLabel }} />;
  };

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <NavigationMenu.Root>
        <NavigationMenu.List style={{ display: "flex", flexDirection: "row", listStyleType: "none" }}>
          {menuItems.map((menuItem, index) => (
            <NavigationMenu.Item 
            key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <NavigationMenu.Trigger style={{ padding: '10px' }}>
                {menuItem.label}
              </NavigationMenu.Trigger>
              {hoveredIndex === index && (
                <SubItemsContainer style={{ display: 'grid' }}>
                  {menuItem.subItems.map((subItem, subIndex) => (
                    <div key={subIndex} onClick={() => handleSubItemClick(subItem.contentId)} style={{ cursor: 'pointer' }}>
                      <StyledSubItemLabel label={subItem.label} />
                      {renderDialogContent()}
                    </div>
                  ))}
                </SubItemsContainer>
              )}
            </NavigationMenu.Item>
          ))}
          <NavigationMenu.Indicator style={{ bottom: 0, height: 5, backgroundColor: "aqua", transition: "all 0.5s ease" }} />
        </NavigationMenu.List>
      </NavigationMenu.Root>
      {activeDialogContent && (
        <div ref={dialogRef} style={{ position: "absolute", display: 'block', padding: "10px", zIndex: 1000, transition: "all 0.5s ease" }}>
          {activeDialogContent}
        </div>
      )}
    </div>
  );
};

export default SupportMenu;