import { supabase } from '@/utils/supabase/client';
import { Cross2Icon } from '@radix-ui/react-icons';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import RoleBasedWrapper from '../RoleBasedWrapper';
import { Button } from './button';
import { ScrollBar } from './scroll-area';

// Verify and update the paths here
const DeptId = dynamic(() => import('../../app/TGR/dros/cards/DeptId'), {
  ssr: false,
});
const IDsCard = dynamic(() => import('../../app/TGR/dros/cards/IDsCard'), {
  ssr: false,
});
const FedsCard = dynamic(() => import('../../app/TGR/dros/cards/FedsCard'), {
  ssr: false,
});
const FedLimits = dynamic(() => import('../../app/TGR/dros/cards/FedLimits'), {
  ssr: false,
});
const FedLimsName = dynamic(() => import('../../app/TGR/dros/cards/FedLimsName'), { ssr: false });
const ProofDocs = dynamic(() => import('../../app/TGR/dros/cards/ProofDocs'), {
  ssr: false,
});
const CorrectionDocs = dynamic(() => import('../../app/TGR/dros/cards/CorrectionDocs'), {
  ssr: false,
});
const DelayedDeliveries = dynamic(() => import('../../app/TGR/dros/cards/DelayedDeliveries'), {
  ssr: false,
});
const LeoPPT = dynamic(() => import('../../app/TGR/dros/cards/LeoPPT'), {
  ssr: false,
});
const PeaceOfficer = dynamic(() => import('../../app/TGR/dros/cards/PeaceOfficerDROS'), {
  ssr: false,
});
const ReserveOfficer = dynamic(() => import('../../app/TGR/dros/cards/ReserveOfficer'), {
  ssr: false,
});
const FederalAgent = dynamic(() => import('../../app/TGR/dros/cards/FederalAgent'), { ssr: false });
const ActiveDuty = dynamic(() => import('../../app/TGR/dros/cards/ActiveDuty'), { ssr: false });
const LocalActive = dynamic(() => import('../../app/TGR/dros/cards/LocalActive'), { ssr: false });
const RetiredMilitary = dynamic(() => import('../../app/TGR/dros/cards/RetiredMilitary'), {
  ssr: false,
});
const InterimDl = dynamic(() => import('../../app/TGR/dros/cards/InterimDl'), {
  ssr: false,
});
const PeaceOfficerDROS = dynamic(() => import('../../app/TGR/dros/cards/PeaceOfficer'), {
  ssr: false,
});
// const ReserveInfo = dynamic(() => import('../../app/TGR/dros/cards/ReserveInfo'), { ssr: false });
const FedsAgentLeo = dynamic(() => import('../../app/TGR/dros/cards/FedsAgentLeo'), { ssr: false });
const PartiucularLimDROS = dynamic(() => import('../../app/TGR/dros/cards/PartiucularLimDROS'), {
  ssr: false,
});
const SecurityGuards = dynamic(() => import('../../app/TGR/dros/cards/SecurityGuards'), {
  ssr: false,
});
const FFL03COE = dynamic(() => import('../../app/TGR/dros/cards/FFL03COE'), {
  ssr: false,
});
const ConsignRedemp = dynamic(() => import('../../app/TGR/dros/cards/ConsignRedemp'), {
  ssr: false,
});
const AmmoPurchase = dynamic(() => import('../../app/TGR/dros/cards/AmmoPurchase'), { ssr: false });
const RegisteredAlien = dynamic(() => import('../../app/TGR/dros/cards/RegisteredAlien'), {
  ssr: false,
});
const StudentVISA = dynamic(() => import('../../app/TGR/dros/cards/StudentVISA'), { ssr: false });
const WorkVISA = dynamic(() => import('../../app/TGR/dros/cards/WorkVISA'), {
  ssr: false,
});
const EmpAuth = dynamic(() => import('../../app/TGR/dros/cards/EmpAuth'), {
  ssr: false,
});
const PendingResident = dynamic(() => import('../../app/TGR/dros/cards/PendingResident'), {
  ssr: false,
});
const FirstLine = dynamic(() => import('../../app/TGR/dros/cards/FirstLine'), {
  ssr: false,
});
const BlueLabel = dynamic(() => import('../../app/TGR/dros/cards/BlueLabel'), {
  ssr: false,
});
const Under21 = dynamic(() => import('../../app/TGR/dros/cards/Under21'), {
  ssr: false,
});
const Guardians = dynamic(() => import('../../app/TGR/dros/cards/Guardians'), {
  ssr: false,
});
// Add other imports as needed

// Width sets fixed width, max-width ensure does not exceed viewport width, overflow-x: hidden hides horizontal overflow
const SubItemsContainer = styled.div`
  position: fixed;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  background: hsl(var(--background));
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: var(--shadow);
  z-index: 50;
  width: min(700px, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  overflow-x: hidden;
`;

const NavigationWrapper = styled.div`
  position: relative;
  width: 100%;
  border-bottom: 1px solid var(--border);
  background-color: hsl(var(--muted));
  padding: 1rem 0;
  margin-bottom: 4rem;
  z-index: 40;
`;

const NavigationList = styled(NavigationMenu.List)`
  display: flex;
  flex-direction: row;
  list-style-type: none;
  margin: 0;
  padding: 0.5rem 0;
  gap: 0.5rem;
`;

const NavigationItem = styled(NavigationMenu.Item)`
  position: relative;
`;

// font-size controls the size of the text
const SubItemWrapper = styled.div`
  cursor: pointer;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  font-size: 0.875rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  background-color: var(--background);
  border: 1px solid transparent;
  outline: none;

  &:hover {
    background-color: var(--accent);
    color: var(--accent-foreground);
    border-color: var(--border);
    box-shadow: 0 0 0 2px hsl(217.2 91.2% 59.8% / 0.5);
  }

  &:focus {
    background-color: var(--accent);
    color: var(--accent-foreground);
    border-color: var(--border);
    outline: none;
    box-shadow: 0 0 0 2px hsl(217.2 91.2% 59.8% / 0.5);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(217.2 91.2% 59.8% / 0.5);
  }
`;

// z-index: 100; ensures the dialog is above other content
const DialogContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  overflow: hidden;
`;

// Close Button - Styled component for the close button
const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1001;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: var(--muted-foreground);

  &:hover {
    background-color: var(--accent);
    color: var(--accent-foreground);
  }
`;

const colorMapping = {
  Special: '#f00', // Red
  Important: '#00f', // Blue
  Note: '#0f0', // Green
  // Add more mappings as needed
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
  DeptId: <DeptId />,
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
  // ReserveInfo: <ReserveInfo />,
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
  FirstLine: <FirstLine />,
  BlueLabel: <BlueLabel />,
  Under21: <Under21 />,
  Guardians: <Guardians />,
  // Add other mappings as necessary
};

const StyledNavigationTrigger = styled(Button)`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  margin: 0.25rem;

  &:hover {
    background-color: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
    border-color: hsl(var(--border));
    outline: none;
    box-shadow: 0 0 0 2px hsl(217.2 91.2% 59.8% / 0.5);
  }

  &:focus {
    background-color: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
    border-color: hsl(var(--border));
    outline: none;
    box-shadow: 0 0 0 2px hsl(217.2 91.2% 59.8% / 0.5);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(217.2 91.2% 59.8% / 0.5);
  }
`;

export default function SupportNavMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeDialogContent, setActiveDialogContent] = useState<React.ReactNode | null>(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [subItemsPosition, setSubItemsPosition] = useState({ left: 0, top: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      let { data, error } = await supabase.from('Navmenuoptions').select('*');

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
          if (subitem_label && card_names) {
            // Only add subItems that have valid labels and contentIds
            menuItem.subItems.push({
              label: subitem_label,
              contentId: card_names,
              link: '',
            }); // Assuming 'link' might be used later or is part of your model
          }
        });

        setMenuItems(Array.from(itemsMap.values()));
        // console.log("Menu items set:", Array.from(itemsMap.values())); // Check the structured menu items
      } else {
        console.error('No data available');
      }
    };

    fetchMenuItems();
  }, []);

  // Close active dialog
  const closeDialog = () => setActiveDialog(null);

  // Clear close timeout
  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Set close timeout with delay
  const setCloseTimeout = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(null);
      setClickedIndex(null);
    }, 300); // 300ms delay before closing
  };

  // Render dialog content based on the active dialog

  const handleSubItemClick = (contentId: string) => {
    const contentComponent =
      dialogContentComponents[contentId as keyof typeof dialogContentComponents];
    if (contentComponent) {
      setActiveDialogContent(contentComponent);
    } else {
      console.error('Content not found for id:', contentId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setActiveDialogContent(null); // Hide active dialog content
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  // Define a component to render subitem labels with styles
  const StyledSubItemLabel = ({ label }: { label: string }) => {
    // Simple parser to replace [color] tags with styled spans
    const parsedLabel = label.replace(/\[(.*?)\](.*?)\[\/\1\]/g, (match, p1, p2) => {
      return `<span style="color: ${p1};">${p2}</span>`;
    });

    return <span dangerouslySetInnerHTML={{ __html: parsedLabel }} />;
  };

  const handleMenuItemHover = (index: number, event: React.MouseEvent<HTMLLIElement>) => {
    clearCloseTimeout();
    const menuItem = event.currentTarget;
    const rect = menuItem.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const containerWidth = Math.min(700, viewportWidth - 40); // 40px for padding

    let left = rect.left;
    let top = rect.bottom + 4; // Add 4px gap between menu and dropdown

    // Check if the container would overflow on the right
    if (left + containerWidth > viewportWidth - 20) {
      // 20px safety margin
      // Align with the right edge of the viewport with some padding
      left = viewportWidth - containerWidth - 20;
    }

    // Ensure the container doesn't go off the left edge of the screen
    left = Math.max(20, left); // 20px minimum padding from left

    setSubItemsPosition({ left, top });
    setHoveredIndex(index);
  };

  const handleMenuItemClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    clearCloseTimeout();

    if (clickedIndex === index) {
      // If clicking the same item, close it
      setClickedIndex(null);
      setHoveredIndex(null);
    } else {
      // Open the clicked item
      setClickedIndex(index);
      handleMenuItemHover(index, event as any);
    }
  };

  const handleMenuItemLeave = () => {
    setCloseTimeout();
  };

  const handleSubMenuEnter = () => {
    clearCloseTimeout();
  };

  const handleSubMenuLeave = () => {
    setCloseTimeout();
  };

  // Determine which index should be active (hover takes precedence over click)
  const activeIndex = hoveredIndex !== null ? hoveredIndex : clickedIndex;

  return (
    <RoleBasedWrapper
      allowedRoles={['user', 'auditor', 'admin', 'super admin', 'dev', 'gunsmith', 'ceo']}
    >
      <NavigationWrapper>
        <NavigationMenu.Root className="relative">
          <NavigationList>
            {menuItems.map((menuItem, index) => (
              <NavigationItem
                key={index}
                onMouseEnter={(event) => handleMenuItemHover(index, event)}
                onMouseLeave={handleMenuItemLeave}
              >
                <NavigationMenu.Trigger asChild>
                  <StyledNavigationTrigger
                    variant="ghost"
                    onClick={(event) => handleMenuItemClick(index, event)}
                  >
                    {menuItem.label}
                  </StyledNavigationTrigger>
                </NavigationMenu.Trigger>
                {activeIndex === index && (
                  <SubItemsContainer
                    style={{
                      left: `${subItemsPosition.left}px`,
                      top: `${subItemsPosition.top}px`,
                    }}
                    onMouseEnter={handleSubMenuEnter}
                    onMouseLeave={handleSubMenuLeave}
                  >
                    {menuItem.subItems.map((subItem, subIndex) => (
                      <SubItemWrapper
                        key={subIndex}
                        onClick={() => handleSubItemClick(subItem.contentId)}
                      >
                        <StyledSubItemLabel label={subItem.label} />
                      </SubItemWrapper>
                    ))}
                  </SubItemsContainer>
                )}
              </NavigationItem>
            ))}
          </NavigationList>
        </NavigationMenu.Root>

        {activeDialogContent && (
          <DialogContainer ref={dialogRef}>
            <CloseButton
              onClick={() => {
                setActiveDialogContent(null);
                setActiveDialog(null);
              }}
            >
              <Cross2Icon className="w-4 h-4" />
            </CloseButton>
            <ScrollAreaPrimitive.Root className="relative overflow-hidden h-[calc(100vh-10rem)]">
              <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] p-4">
                {activeDialogContent}
              </ScrollAreaPrimitive.Viewport>
              <ScrollBar orientation="vertical" />
            </ScrollAreaPrimitive.Root>
          </DialogContainer>
        )}
      </NavigationWrapper>
    </RoleBasedWrapper>
  );
}
