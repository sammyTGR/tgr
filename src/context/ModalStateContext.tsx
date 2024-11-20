import { createContext, useCallback, useContext } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AuditData } from "../app/admin/audits/submit/edit-audit-form";

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

  // Query for getting modal state
  const { data: modalState } = useQuery<ModalState>({
    queryKey: MODAL_KEY,
    queryFn: () => ({ isOpen: false, selectedAudit: null }),
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: { isOpen: false, selectedAudit: null },
  });

  // Mutation for setting modal state
  const setModalStateMutation = useMutation({
    mutationFn: (newState: ModalState) => {
      return Promise.resolve(newState);
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(MODAL_KEY, newState);
    },
  });

  const setModalState = useCallback(
    (newState: ModalState) => {
      setModalStateMutation.mutate(newState);
    },
    [setModalStateMutation]
  );

  return (
    <ModalStateContext.Provider
      value={{
        modalState: modalState!,
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
