import { createContext, useCallback, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuditData } from "../app/admin/audits/submit/edit-audit-form"; // Make sure to import your Audit type

export interface ModalState {
  isOpen: boolean;
  selectedAudit: AuditData | null;
}

const MODAL_KEY = ["edit-modal-state"] as const;

const ModalStateContext = createContext<{
  modalState: ModalState;
  setModalState: (state: ModalState) => void;
}>({
  modalState: { isOpen: false, selectedAudit: null },
  setModalState: () => {},
});

export const ModalStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();

  const { data: modalState } = useQuery<ModalState>({
    queryKey: MODAL_KEY,
    queryFn: () => ({ isOpen: false, selectedAudit: null }),
    staleTime: Infinity,
  });

  const setModalState = useCallback(
    (newState: ModalState) => {
      queryClient.setQueryData(MODAL_KEY, newState);
    },
    [queryClient]
  );

  return (
    <ModalStateContext.Provider
      value={{
        modalState: modalState || { isOpen: false, selectedAudit: null },
        setModalState,
      }}
    >
      {children}
    </ModalStateContext.Provider>
  );
};

export const useModalState = () => {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error("useModalState must be used within a ModalStateProvider");
  }
  return context;
};
