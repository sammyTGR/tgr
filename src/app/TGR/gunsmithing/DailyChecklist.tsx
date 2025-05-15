import { useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil1Icon } from '@radix-ui/react-icons';
import DOMPurify from 'dompurify';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';

interface Employee {
  user_uuid: string;
  name: string;
}

interface DailyChecklistProps {
  userRole: string | null;
  userUuid: string | null;
  userName: string | null;
  onSubmit: () => void;
}

interface FirearmWithGunsmith {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string | null;
  maintenance_frequency: number | null;
  maintenance_notes: string | null;
  status: string | null;
  assigned_to: string | null;
  rental_notes: string | null;
  verified_status: string | null;
  admin_request?: string;
  admin_name?: string;
  admin_uuid?: string;
  gunsmith_response?: string;
  has_new_request: boolean;
}

interface RequestResponse {
  id: number;
  message: string;
  timestamp: string;
  authorUuid: string;
  linkedInquiryId?: number | null;
}

interface RequestResponsePair {
  request: RequestResponse;
  response: RequestResponse | null;
}

interface CombinedMessage extends RequestResponse {
  type: 'inquiry' | 'response';
}

interface UIState {
  selectedInquiryId: number | null;
  editingInquiryId: string | null;
  editingResponseId: number | null;
  editingNoteId: number | null;
  activeRequestFirearmId: number | null;
  activeResponseFirearmId: number | null;
  showOnlyPendingRequests: boolean;
  newRequest: string;
  newResponse: string;
  editingInquiryText: string;
  editingResponseText: string;
  hoverState: {
    inquiryId: number | null;
    canEdit: boolean;
    type: 'inquiry' | 'response' | null;
  };
}

type MaintenanceNotesForm = {
  maintenance_notes: string;
};

interface MaintenanceNotesSectionProps {
  firearm: FirearmWithGunsmith;
  onSave: (notes: string) => void;
}

// Custom hook for managing UI state with React Query
function useUIState() {
  return useQuery({
    queryKey: ['uiState'],
    queryFn: () =>
      ({
        selectedInquiryId: null,
        editingInquiryId: null,
        editingResponseId: null,
        editingNoteId: null,
        activeRequestFirearmId: null,
        activeResponseFirearmId: null,
        showOnlyPendingRequests: false,
        newRequest: '',
        newResponse: '',
        editingInquiryText: '',
        editingResponseText: '',
        hoverState: {
          inquiryId: null,
          canEdit: false,
          type: null,
        },
      }) as UIState,
    staleTime: Infinity,
  });
}

// Helper function to parse request responses
const parseRequestResponses = (jsonString: string | null): RequestResponse[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    const responses = Array.isArray(parsed) ? parsed : [parsed];
    return responses.map((response) => ({
      ...response,
      id: typeof response.id === 'number' ? response.id : Math.floor(Math.random() * 1000000),
      timestamp: response.timestamp || new Date().toISOString(),
      authorUuid: response.authorUuid || 'Unknown',
      linkedInquiryId: response.linkedInquiryId || null,
    }));
  } catch {
    return [
      {
        id: Math.floor(Math.random() * 1000000),
        message: DOMPurify.sanitize(jsonString || ''),
        timestamp: new Date().toISOString(),
        authorUuid: 'Unknown',
        linkedInquiryId: undefined,
      },
    ];
  }
};

// Helper function to format dates
const formatDate = (dateString: string) => {
  if (dateString === 'Unknown') return 'Unknown Date';
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? 'Invalid Date'
    : date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const MaintenanceNotesSection = ({ firearm, onSave }: MaintenanceNotesSectionProps) => {
  const queryClient = useQueryClient();
  const { data: uiState } = useUIState();

  // Add mutation for updating notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({ maintenance_notes: DOMPurify.sanitize(note) })
        .eq('id', id);
      if (error) throw error;
      return { id, note };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      toast.success('Notes updated successfully');
    },
    onError: () => {
      toast.error('Failed to update notes');
    },
  });

  // Add toggle function
  const toggleEditNote = (id: number) => {
    queryClient.setQueryData(['uiState'], (old: UIState) => ({
      ...old,
      editingNoteId: old.editingNoteId === id ? null : id,
    }));
  };

  const form = useForm<MaintenanceNotesForm>({
    defaultValues: {
      maintenance_notes: firearm.maintenance_notes || '',
    },
  });

  const onSubmit = (data: MaintenanceNotesForm) => {
    updateNotesMutation.mutate({
      id: firearm.id,
      note: data.maintenance_notes,
    });
    toggleEditNote(firearm.id);
  };

  return (
    <div className="mt-2">
      <p className="text-small font-small text-muted-foreground">Maintenance Notes:</p>
      {uiState?.editingNoteId === firearm.id ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="maintenance_notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} placeholder="Update daily note..." className="mt-2" />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="mt-2 space-x-2">
              <Button type="submit" variant="outline">
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => toggleEditNote(firearm.id)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <>
          <p className="text-medium font-medium text-foreground">
            {DOMPurify.sanitize(firearm.maintenance_notes || 'No maintenance notes.')}
          </p>
          <Button variant="outline" onClick={() => toggleEditNote(firearm.id)} className="mt-2">
            Edit Note
          </Button>
        </>
      )}
    </div>
  );
};

export default function DailyChecklist({
  userRole,
  userUuid,
  userName,
  onSubmit,
}: DailyChecklistProps) {
  const queryClient = useQueryClient();

  // Query for employees
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('user_uuid, name');
      if (error) throw error;
      return data;
    },
  });

  // Query for firearms
  const { data: firearms = [], isLoading } = useQuery({
    queryKey: ['firearms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('firearms_maintenance')
        .select('*')
        .eq('rental_notes', 'With Gunsmith');
      if (error) throw error;
      return Promise.resolve(
        data.map((firearm) => {
          const adminRequests = parseRequestResponses(firearm.admin_request);
          const gunsmithResponses = parseRequestResponses(firearm.gunsmith_response);
          return {
            ...firearm,
            has_new_request: adminRequests.length > gunsmithResponses.length,
          };
        })
      );
    },
  });

  // UI State management
  const { data: uiState, refetch: refetchUI } = useUIState();

  // Mutation for updating UI state
  const updateUIMutation = useMutation({
    mutationFn: (newState: Partial<UIState>) => {
      return Promise.resolve(
        queryClient.setQueryData(['uiState'], (old: UIState) => ({
          ...old,
          ...newState,
        }))
      );
    },
  });

  // Mutation for updating firearm notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({ maintenance_notes: DOMPurify.sanitize(note) })
        .eq('id', id);
      if (error) throw error;
      return { id, note };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      toast.success('Notes updated successfully');
    },
    onError: () => {
      toast.error('Failed to update notes');
    },
  });

  // Mutation for submitting admin request
  const submitAdminRequestMutation = useMutation({
    mutationFn: async ({ id, request }: { id: number; request: string }) => {
      const firearm = firearms.find((f) => f.id === id);
      if (!firearm) throw new Error('Firearm not found');

      const newRequestObj: RequestResponse = {
        id: Number(crypto.randomUUID().replace(/-/g, '')),
        message: DOMPurify.sanitize(request),
        timestamp: new Date().toISOString(),
        authorUuid: userUuid || 'Unknown',
      };

      const existingRequests = parseRequestResponses(firearm.admin_request || '');
      const updatedRequests = [...existingRequests, newRequestObj];

      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          admin_request: JSON.stringify(updatedRequests),
          admin_name: userName,
          admin_uuid: userUuid,
        })
        .eq('id', id);

      if (error) throw error;

      // Fetch gunsmith email and send notification
      const { data: gunsmithData } = await supabase
        .from('employees')
        .select('contact_info')
        .eq('role', 'gunsmith')
        .single();

      if (gunsmithData?.contact_info) {
        await fetch('/api/send_email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: gunsmithData.contact_info,
            subject: 'Requesting Update',
            templateName: 'GunsmithNewRequest',
            templateData: {
              firearmId: firearm.id,
              firearmName: firearm.firearm_name,
              requestedBy: userName || 'Unknown',
              requestMessage: request,
            },
          }),
        });
      }

      return { id, updatedRequests };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      updateUIMutation.mutate({
        newRequest: '',
        activeRequestFirearmId: null,
      });
      toast.success('Request submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit request');
    },
  });

  // Mutation for submitting gunsmith response
  const submitResponseMutation = useMutation({
    mutationFn: async ({
      firearmId,
      inquiryId,
      response,
    }: {
      firearmId: number;
      inquiryId: number;
      response: string;
    }) => {
      const firearm = firearms.find((f) => f.id === firearmId);
      if (!firearm) throw new Error('Firearm not found');

      const newResponseObj: RequestResponse = {
        id: Math.floor(Math.random() * 1000000),
        message: DOMPurify.sanitize(response),
        timestamp: new Date().toISOString(),
        authorUuid: userUuid || 'Unknown',
        linkedInquiryId: inquiryId,
      };

      const existingResponses = parseRequestResponses(firearm.gunsmith_response || '');
      const updatedResponses = [...existingResponses, newResponseObj];

      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          gunsmith_response: JSON.stringify(updatedResponses),
          has_new_request: false,
        })
        .eq('id', firearmId);

      if (error) throw error;
      return { firearmId, updatedResponses };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      updateUIMutation.mutate({
        newResponse: '',
        activeResponseFirearmId: null,
        selectedInquiryId: null,
      });
      toast.success('Response submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit response');
    },
  });

  // Mutation for editing inquiry
  const editInquiryMutation = useMutation({
    mutationFn: async ({
      firearmId,
      inquiryId,
      newText,
    }: {
      firearmId: number;
      inquiryId: number;
      newText: string;
    }) => {
      const firearm = firearms.find((f) => f.id === firearmId);
      if (!firearm) throw new Error('Firearm not found');

      const existingInquiries = parseRequestResponses(firearm.admin_request || '');
      const updatedInquiries = existingInquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, message: DOMPurify.sanitize(newText) } : inquiry
      );

      const { error } = await supabase
        .from('firearms_maintenance')
        .update({ admin_request: JSON.stringify(updatedInquiries) })
        .eq('id', firearmId);

      if (error) throw error;
      return { firearmId, updatedInquiries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      updateUIMutation.mutate({
        editingInquiryId: null,
        editingInquiryText: '',
      });
      toast.success('Inquiry updated successfully');
    },
    onError: () => {
      toast.error('Failed to update inquiry');
    },
  });

  // Mutation for editing response
  const editResponseMutation = useMutation({
    mutationFn: async ({
      firearmId,
      responseId,
      newText,
    }: {
      firearmId: number;
      responseId: number;
      newText: string;
    }) => {
      const firearm = firearms.find((f) => f.id === firearmId);
      if (!firearm) throw new Error('Firearm not found');

      const existingResponses = parseRequestResponses(firearm.gunsmith_response || '');
      const updatedResponses = existingResponses.map((response) =>
        response.id === responseId
          ? { ...response, message: DOMPurify.sanitize(newText) }
          : response
      );

      const { error } = await supabase
        .from('firearms_maintenance')
        .update({ gunsmith_response: JSON.stringify(updatedResponses) })
        .eq('id', firearmId);

      if (error) throw error;
      return { firearmId, updatedResponses };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      updateUIMutation.mutate({
        editingResponseId: null,
        editingResponseText: '',
      });
      toast.success('Response updated successfully');
    },
    onError: () => {
      toast.error('Failed to update response');
    },
  });

  // Mutation for submitting daily checklist
  const submitChecklistMutation = useMutation({
    mutationFn: async () => {
      const updates = firearms.map((firearm) => {
        const { has_new_request, ...firearmData } = firearm;
        return {
          ...firearmData,
          last_maintenance_date: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('firearms_maintenance')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      return updates;
    },
    onSuccess: () => {
      localStorage.setItem('lastDailyChecklistSubmission', new Date().toDateString());
      queryClient.invalidateQueries({ queryKey: ['firearms'] });
      toast.success('Daily maintenance notes and requests updated successfully');
      onSubmit();
    },
    onError: () => {
      toast.error('Failed to update maintenance notes and requests');
    },
  });

  // Helper functions
  const getEmployeeName = useCallback(
    (uuid: string | null | undefined) => {
      if (!uuid) return 'Unknown';
      const employee = employees?.find((e) => e.user_uuid === uuid);
      return employee?.name || 'Unknown';
    },
    [employees]
  );

  const handleHover = (id: number, authorUuid: string, type: 'inquiry' | 'response') => {
    const isAdmin = ['admin', 'super admin', 'dev'].includes(userRole || '');
    const canEdit =
      (type === 'response' && userRole === 'gunsmith' && authorUuid === userUuid) ||
      (type === 'inquiry' && isAdmin && authorUuid === userUuid);

    updateUIMutation.mutate({
      hoverState: {
        inquiryId: id,
        canEdit,
        type,
      },
    });
  };

  const handleLeave = () => {
    if (!uiState?.editingInquiryId && !uiState?.editingResponseId) {
      updateUIMutation.mutate({
        hoverState: {
          inquiryId: null,
          canEdit: false,
          type: null,
        },
      });
    }
  };

  const toggleEditNote = (id: number) => {
    updateUIMutation.mutate({
      editingNoteId: uiState?.editingNoteId === id ? null : id,
    });
  };

  const filteredFirearms = uiState?.showOnlyPendingRequests
    ? firearms.filter((f) => f.has_new_request)
    : firearms;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <h2 className="text-xl font-semibold mb-4">Firearms With Gunsmith</h2>
        <Button
          variant="gooeyLeft"
          onClick={() =>
            updateUIMutation.mutate({
              showOnlyPendingRequests: !uiState?.showOnlyPendingRequests,
            })
          }
          className="mb-4"
        >
          {uiState?.showOnlyPendingRequests ? 'Show All Firearms' : 'Show Only Pending Requests'}
        </Button>

        {filteredFirearms.length === 0 ? (
          <p>No firearms currently with gunsmith.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredFirearms.map((firearm) => (
              <div key={firearm.id} className="border p-4 rounded-md">
                <h3 className="font-medium flex items-center">
                  {DOMPurify.sanitize(firearm.firearm_name)} (
                  {DOMPurify.sanitize(firearm.firearm_type)})
                  {firearm.has_new_request && (
                    <Badge variant="destructive" className="ml-2">
                      New Status Update Request
                    </Badge>
                  )}
                </h3>
                <p>Status: {DOMPurify.sanitize(firearm.status || 'N/A')}</p>
                <p>Last Maintenance: {formatDate(firearm.last_maintenance_date || 'N/A')}</p>

                {/* Maintenance Notes Section */}
                <MaintenanceNotesSection
                  firearm={firearm}
                  onSave={(notes) =>
                    updateNotesMutation.mutate({
                      id: firearm.id,
                      note: notes,
                    })
                  }
                />

                {/* Requests and Responses Section */}
                <div className="mt-6">
                  <h4 className="font-medium">Requests and Responses:</h4>
                  {(() => {
                    const requests = parseRequestResponses(firearm.admin_request || '');
                    const responses = parseRequestResponses(firearm.gunsmith_response || '');
                    const messagePairs: RequestResponsePair[] = requests.map((request, index) => ({
                      request,
                      response: responses[index] || null,
                    }));

                    return messagePairs.map((pair, index) => (
                      <div
                        key={`pair-${index}`}
                        className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50"
                      >
                        {/* Inquiry Section */}
                        <div className="relative group">
                          <div
                            className="p-2 -mx-2 rounded transition-colors hover:bg-muted/10"
                            onMouseEnter={() =>
                              handleHover(pair.request.id, pair.request.authorUuid, 'inquiry')
                            }
                            onMouseLeave={handleLeave}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">Admin Inquiry</span>
                                <span>({getEmployeeName(pair.request.authorUuid)})</span>
                                <span className="text-xs">
                                  {formatDate(pair.request.timestamp)}
                                </span>
                              </div>
                              {uiState?.hoverState.inquiryId === pair.request.id &&
                                uiState.hoverState.type === 'inquiry' &&
                                uiState.hoverState.canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateUIMutation.mutate({
                                        editingInquiryId: pair.request.id.toString(),
                                        editingInquiryText: pair.request.message,
                                      })
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Pencil1Icon className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                            </div>

                            {uiState?.editingInquiryId === pair.request.id.toString() ? (
                              <div className="mt-2">
                                <Textarea
                                  value={uiState.editingInquiryText}
                                  onChange={(e) =>
                                    updateUIMutation.mutate({
                                      editingInquiryText: e.target.value,
                                    })
                                  }
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      editInquiryMutation.mutate({
                                        firearmId: firearm.id,
                                        inquiryId: pair.request.id,
                                        newText: uiState.editingInquiryText,
                                      })
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateUIMutation.mutate({
                                        editingInquiryId: null,
                                      })
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-medium">
                                {DOMPurify.sanitize(pair.request.message)}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Response Section */}
                        <div className="mt-3">
                          {/* Gunsmith response button */}
                          {userRole === 'gunsmith' &&
                            !responses.find((r) => r.linkedInquiryId === pair.request.id) && (
                              <div
                                className="relative p-2 -mx-2 rounded hover:bg-muted/10 transition-colors cursor-pointer"
                                onMouseEnter={() =>
                                  updateUIMutation.mutate({
                                    selectedInquiryId: pair.request.id,
                                  })
                                }
                                onMouseLeave={() => {
                                  if (!uiState?.activeResponseFirearmId) {
                                    updateUIMutation.mutate({
                                      selectedInquiryId: null,
                                    });
                                  }
                                }}
                              >
                                <div className="absolute right-2 top-2 z-10">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-background"
                                    onClick={() =>
                                      updateUIMutation.mutate({
                                        activeResponseFirearmId: firearm.id,
                                        selectedInquiryId: pair.request.id,
                                      })
                                    }
                                  >
                                    Respond to Inquiry
                                  </Button>
                                </div>
                              </div>
                            )}

                          {/* Responses list */}
                          {responses
                            .filter(
                              (response) =>
                                response.linkedInquiryId === pair.request.id ||
                                !response.linkedInquiryId
                            )
                            .map((response, idx) => (
                              <div
                                key={`response-${idx}`}
                                className={`relative group mt-3 pl-4 border-l-2 ${
                                  response.linkedInquiryId === pair.request.id
                                    ? 'border-blue-500'
                                    : 'border-gray-300'
                                }`}
                                onMouseEnter={() =>
                                  handleHover(response.id, response.authorUuid, 'response')
                                }
                                onMouseLeave={handleLeave}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-medium">
                                      {response.linkedInquiryId === pair.request.id
                                        ? 'Direct Response'
                                        : 'General Response'}
                                    </span>
                                    <span>({getEmployeeName(response.authorUuid)})</span>
                                    <span className="text-xs">
                                      {formatDate(response.timestamp)}
                                    </span>
                                  </div>
                                  {uiState?.hoverState.inquiryId === response.id &&
                                    uiState.hoverState.type === 'response' &&
                                    uiState.hoverState.canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          updateUIMutation.mutate({
                                            editingResponseId: response.id,
                                            editingResponseText: response.message,
                                          })
                                        }
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Pencil1Icon className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    )}
                                </div>
                                {uiState?.editingResponseId === response.id ? (
                                  <div className="mt-2">
                                    <Textarea
                                      value={uiState.editingResponseText}
                                      onChange={(e) =>
                                        updateUIMutation.mutate({
                                          editingResponseText: e.target.value,
                                        })
                                      }
                                      className="min-h-[100px]"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          editResponseMutation.mutate({
                                            firearmId: firearm.id,
                                            responseId: response.id,
                                            newText: uiState.editingResponseText,
                                          })
                                        }
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          updateUIMutation.mutate({
                                            editingResponseId: null,
                                            editingResponseText: '',
                                          })
                                        }
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="mt-1 text-medium">
                                    {DOMPurify.sanitize(response.message)}
                                  </p>
                                )}
                              </div>
                            ))}

                          {/* Response Form */}
                          {uiState?.activeResponseFirearmId === firearm.id &&
                            uiState?.selectedInquiryId === pair.request.id && (
                              <div className="mt-2">
                                <Textarea
                                  value={uiState?.newResponse || ''}
                                  onChange={(e) =>
                                    updateUIMutation.mutate({
                                      newResponse: e.target.value,
                                    })
                                  }
                                  placeholder="Enter response..."
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      submitResponseMutation.mutate({
                                        firearmId: firearm.id,
                                        inquiryId: pair.request.id,
                                        response: uiState?.newResponse || '',
                                      })
                                    }
                                    disabled={!uiState?.newResponse}
                                  >
                                    Submit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() =>
                                      updateUIMutation.mutate({
                                        activeResponseFirearmId: null,
                                        selectedInquiryId: null,
                                      })
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ));
                  })()}

                  {/* New Request Button (for admin and super admin) */}
                  {(userRole === 'admin' || userRole === 'super admin' || userRole === 'dev') && (
                    <div className="mt-4">
                      {uiState?.activeRequestFirearmId === firearm.id ? (
                        <>
                          <Textarea
                            value={uiState?.newRequest || ''}
                            onChange={(e) =>
                              updateUIMutation.mutate({
                                newRequest: e.target.value,
                              })
                            }
                            placeholder="Enter new inquiry..."
                            className="mt-2"
                          />
                          <Button
                            variant="outline"
                            onClick={() =>
                              submitAdminRequestMutation.mutate({
                                id: firearm.id,
                                request: uiState?.newRequest || '',
                              })
                            }
                            className="mt-2 mr-2"
                            disabled={!uiState?.newRequest}
                          >
                            Submit Request
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              updateUIMutation.mutate({
                                activeRequestFirearmId: null,
                              })
                            }
                            className="mt-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() =>
                            updateUIMutation.mutate({
                              activeRequestFirearmId: firearm.id,
                            })
                          }
                          className="mt-2"
                        >
                          New Inquiry
                        </Button>
                      )}
                    </div>
                  )}

                  {/* New Response Button (only for gunsmith role) */}
                  {userRole === 'gunsmith' && (
                    <div className="mt-4">
                      {uiState?.activeResponseFirearmId === firearm.id ? (
                        <>
                          <Textarea
                            value={uiState?.newResponse || ''}
                            onChange={(e) =>
                              updateUIMutation.mutate({
                                newResponse: e.target.value,
                              })
                            }
                            placeholder="Enter new response..."
                            className="mt-2"
                          />
                          <Button
                            variant="outline"
                            onClick={() =>
                              submitResponseMutation.mutate({
                                firearmId: firearm.id,
                                inquiryId: uiState?.selectedInquiryId!,
                                response: uiState?.newResponse || '',
                              })
                            }
                            className="mt-2 mr-2"
                            disabled={!uiState?.newResponse}
                          >
                            Submit Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              updateUIMutation.mutate({
                                activeResponseFirearmId: null,
                              })
                            }
                            className="mt-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() =>
                            updateUIMutation.mutate({
                              activeResponseFirearmId: firearm.id,
                            })
                          }
                          className="mt-2"
                        >
                          New Response
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Button
          variant="gooeyRight"
          onClick={() => submitChecklistMutation.mutate()}
          disabled={firearms.length === 0}
          className="w-full"
        >
          Submit Daily Checklist Firearms
        </Button>
      </div>
    </div>
  );
}
