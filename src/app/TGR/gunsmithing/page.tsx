'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { FirearmsMaintenanceData, columns } from './columns';
import { DataTable } from './data-table';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { cycleFirearms } from '@/utils/cycleFirearms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from 'sonner';
import AllFirearmsList from './AllFirearmsList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import styles from './profiles.module.css';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import classNames from 'classnames';
import DailyChecklist from './DailyChecklist';
import { DataTableToolbar } from './data-table-toolbar';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

const words = 'Gunsmithing Maintenance';

export default function GunsmithingMaintenance() {
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDailyChecklistSubmitted, setIsDailyChecklistSubmitted] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dailyChecklist');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [persistedListId, setPersistedListId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const [newFirearm, setNewFirearm] = useState({
    firearm_type: 'handgun',
    firearm_name: '',
    last_maintenance_date: new Date().toISOString(),
    maintenance_frequency: 30,
    maintenance_notes: '',
    status: 'New',
    assigned_to: null,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 30; // Set a fixed page size

  const fetchUserRoleAndUuid = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error fetching user:', userError.message);
      return;
    }

    const user = userData.user;
    setUserUuid(user?.id || '');

    try {
      const { data: roleData, error: roleError } = await supabase
        .from('employees')
        .select('role')
        .eq('user_uuid', user?.id)
        .single();

      if (roleError || !roleData) {
        console.error('Error fetching role:', roleError?.message || 'No role found');
        return;
      }

      setUserRole(roleData.role);
    } catch (error) {
      console.error('Unexpected error fetching role:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserRoleAndUuid();
  }, [fetchUserRoleAndUuid]);

  const fetchFirearmsMaintenanceData = useCallback(async (role: string) => {
    const { data, error } = await supabase.from('firearms_maintenance').select('*');

    if (error) {
      console.error('Error fetching initial data:', error.message);
      throw new Error(error.message);
    }

    // Clear the status field for each firearm
    // const updatedData = data.map((item: FirearmsMaintenanceData) => ({
    //   ...item,
    //   status: "", // Clear the status
    // }));

    if (role === 'gunsmith') {
      // Separate handguns and long guns
      const handguns = data.filter(
        (item: FirearmsMaintenanceData) => item.firearm_type === 'handgun'
      );
      const longGuns = data.filter(
        (item: FirearmsMaintenanceData) => item.firearm_type === 'long gun'
      );

      // Cycle through the lists to get 13 of each
      const cycledHandguns = cycleFirearms(handguns, 13);
      const cycledLongGuns = cycleFirearms(longGuns, 13);

      return [...cycledHandguns, ...cycledLongGuns];
    }

    // For admin and super admin, return full data
    return data;
  }, []);

  const fetchPersistedData = useCallback(async (userUuid: string) => {
    try {
      const { data, error } = await supabase
        .from('persisted_firearms_list')
        .select('id, firearms_list')
        // .eq("user_uuid", userUuid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // console.log("No persisted data found for user");
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching persisted data:', error);
      throw error;
    }
  }, []);

  const persistData = useCallback(
    async (firearmsList: FirearmsMaintenanceData[]) => {
      if (!userUuid) {
        console.error('Cannot persist data: user_uuid is null or undefined');
        toast.error('Failed to save data. User ID is missing.');
        return;
      }

      const persistedData = {
        firearms_list: firearmsList,
        user_uuid: userUuid, // Add this line
      };

      try {
        if (persistedListId) {
          const { error } = await supabase
            .from('persisted_firearms_list')
            .update(persistedData)
            .eq('id', persistedListId);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('persisted_firearms_list')
            .insert([persistedData])
            .select();

          if (error) throw error;

          if (data && data.length > 0) {
            setPersistedListId(data[0].id);
          }
        }

        // toast.success("Data saved successfully.");
      } catch (error) {
        console.error('Error persisting data:', error);
        toast.error('Failed to save data. Please try again.');
      }
    },
    [persistedListId, userUuid] // Add userUuid to the dependency array
  );

  const fetchData = useCallback(
    async (retryCount = 0) => {
      setLoading(true);
      try {
        if (!userRole) {
          // console.log("User role not available, waiting...");
          return;
        }

        if (userRole === 'gunsmith' && userUuid) {
          const persistedData = await fetchPersistedData(userUuid || '');
          if (persistedData) {
            // console.log("Found persisted data:", persistedData);
            if (Array.isArray(persistedData.firearms_list)) {
              setData(persistedData.firearms_list as FirearmsMaintenanceData[]);
              setPersistedListId(persistedData.id);
            } else {
              console.error('Persisted firearms_list is not an array');
              throw new Error('Invalid persisted data format');
            }
          } else {
            // console.log("No persisted data found, fetching new data");
            const fetchedData = await fetchFirearmsMaintenanceData(userRole);
            setData(fetchedData);
            await persistData(fetchedData);
          }
        } else {
          // For admin and super admin, always fetch fresh data
          const fetchedData = await fetchFirearmsMaintenanceData(userRole);
          setData(fetchedData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        if (
          error instanceof Error &&
          error.message.includes('statement timeout') &&
          retryCount < 3
        ) {
          // console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
        } else {
          toast.error('Failed to load data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchFirearmsMaintenanceData, fetchPersistedData, persistData, userRole]
  );

  useEffect(() => {
    if (userRole) {
      fetchData();
    }
  }, [fetchData, userRole]);

  useEffect(() => {
    // Check if the checklist has been submitted today
    const lastSubmissionDate = localStorage.getItem('lastDailyChecklistSubmission');
    const today = new Date().toDateString();

    if (lastSubmissionDate === today) {
      setIsDailyChecklistSubmitted(true);
    } else {
      setIsDailyChecklistSubmitted(false);
    }
  }, []);

  const handleDailyChecklistSubmit = useCallback(() => {
    setIsDailyChecklistSubmitted(true);
  }, []);

  const handleTabChange = (value: string) => {
    if (!isDailyChecklistSubmitted && value !== 'dailyChecklist') {
      setIsAlertOpen(true);
    } else {
      setSelectedTab(value);
    }
  };

  const handleStatusChange = async (id: number, status: string | null) => {
    try {
      const updatedData = data.map((item) =>
        item.id === id ? { ...item, status: status !== null ? status : '' } : item
      );
      const { error } = await supabase.from('firearms_maintenance').update({ status }).eq('id', id);

      if (error) {
        throw error;
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: status !== null ? status : '' } : item
        )
      );
      setData(updatedData);
      await persistData(updatedData);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNotesChange = async (id: number, notes: string, shouldSave = true) => {
    // Update local state
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id
          ? {
              ...item,
              maintenance_notes: notes,
              last_maintenance_date: new Date().toISOString(),
            }
          : item
      )
    );

    // Only save to database if shouldSave is true
    if (shouldSave) {
      try {
        const { error } = await supabase
          .from('firearms_maintenance')
          .update({
            maintenance_notes: notes,
            last_maintenance_date: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;

        await persistData(data);
        toast.success('Notes saved successfully');
      } catch (error) {
        console.error('Error saving notes:', error);
        toast.error('Failed to save notes');
      }
    }
  };

  const handleSaveNotes = async (id: number) => {
    try {
      const firearm = data.find((item) => item.id === id);
      if (!firearm) return;

      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          maintenance_notes: firearm.maintenance_notes,
          last_maintenance_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await persistData(data);
      toast.success('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes.');
    }
  };

  const handleUpdateFrequency = async (id: number, frequency: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, maintenance_frequency: frequency } : item
      )
    );
    await persistData(data);
  };

  const handleAddFirearm = async () => {
    try {
      const { data: newFirearmData, error } = await supabase
        .from('firearms_maintenance')
        .insert([newFirearm])
        .select('*');

      if (error) {
        throw error;
      }

      if (newFirearmData && newFirearmData.length > 0) {
        setData((prevData) => {
          const updatedData = [...prevData, newFirearmData[0]];
          persistData(updatedData);

          // Calculate the new page index based on the total number of items
          const newPageIndex = Math.floor(updatedData.length / pageSize);

          // Update the pagination state
          setPageIndex(newPageIndex);

          return updatedData;
        });
      } else {
        throw new Error('No data returned from insert operation');
      }

      // Close the dialog after adding the firearm
      setIsDialogOpen(false);
      setNewFirearm({
        firearm_type: 'handgun',
        firearm_name: '',
        last_maintenance_date: new Date().toISOString(),
        maintenance_frequency: 30,
        maintenance_notes: '',
        status: 'New',
        assigned_to: null,
      });
    } catch (error) {
      console.error('Error adding firearm:', error);
    }
  };

  const handleFirearmInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setNewFirearm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteFirearm = async (id: number) => {
    try {
      const { error } = await supabase.from('firearms_maintenance').delete().eq('id', id);

      if (error) {
        throw error;
      }

      const updatedData = data.filter((item) => item.id !== id);
      setData(updatedData);
      await persistData(updatedData);
    } catch (error) {
      console.error('Error deleting firearm:', error);
    }
  };

  useEffect(() => {
    const FirearmsMaintenanceTableSubscription = supabase
      .channel('custom-all-firearms-maintenance-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'firearms_maintenance' },
        (payload) => {
          setData((prevData) => {
            let updatedData = [...prevData];

            if (payload.eventType === 'INSERT') {
              const exists = prevData.some((item) => item.id === payload.new.id);
              if (!exists) {
                updatedData = [payload.new as FirearmsMaintenanceData, ...prevData];
              }
            } else if (payload.eventType === 'UPDATE') {
              updatedData = prevData.map((item) =>
                item.id === payload.new.id ? (payload.new as FirearmsMaintenanceData) : item
              );
            } else if (payload.eventType === 'DELETE') {
              updatedData = prevData.filter((item) => item.id !== payload.old.id);
            }

            return updatedData;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(FirearmsMaintenanceTableSubscription);
    };
  }, [userUuid]);

  const handleSubmit = () => {
    // Check if all firearms have notes and status
    const incompleteFirearms = data.filter(
      (firearm) => !firearm.maintenance_notes || !firearm.status
    );

    if (incompleteFirearms.length > 0) {
      toast.error('Please ensure all firearms have detailed notes and a status before submitting.');
      return;
    }
    setIsSubmitDialogOpen(true);
  };

  const confirmSubmit = async () => {
    try {
      for (const firearm of data) {
        await supabase
          .from('firearms_maintenance')
          .update({
            maintenance_notes: firearm.maintenance_notes,
            status: firearm.status,
            last_maintenance_date: new Date().toISOString(),
          })
          .eq('id', firearm.id);
      }

      // Clear persisted list after submission
      if (persistedListId) {
        await supabase.from('persisted_firearms_list').delete().eq('id', persistedListId);
        setPersistedListId(null);
      }

      const newFirearmsList = await fetchFirearmsMaintenanceData(userRole || '');
      const resetFirearmsList = newFirearmsList.map((firearm) => ({
        ...firearm,
        status: '',
        maintenance_notes: '',
      }));

      setData(resetFirearmsList);
      await persistData(resetFirearmsList);

      setIsSubmitDialogOpen(false);
      toast.success('Maintenance list submitted successfully!');
    } catch (error) {
      console.error('Failed to submit maintenance list:', error);
      toast.error('Failed to submit maintenance list.');
    }
  };

  const regenerateFirearmsList = async () => {
    try {
      const response = await fetch('/api/firearms-maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generateNewList', data: { userUuid } }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate firearms list');
      }

      const { firearms } = await response.json();
      setData(firearms);

      // Clear the persisted list and save the new one
      await supabase.from('persisted_firearms_list').delete().eq('user_uuid', userUuid);
      await persistData(firearms);

      toast.success('Firearms list regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate firearms list:', error);
      toast.error('Failed to regenerate firearms list.');
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={['gunsmith', 'admin', 'super admin', 'dev']}>
      <Toaster position="top-right" />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Daily Checklist Not Submitted</AlertDialogTitle>
            <AlertDialogDescription>
              Please submit the daily checklist before starting maintenance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div
        className={`flex flex-col space-y-4 w-full overflow-hidden ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-5rem)] lg:w-[calc(100vw-5rem)] transition-all duration-300`}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            defaultValue="dailyChecklist"
            className="flex-1 flex flex-col"
            value={selectedTab}
            onValueChange={handleTabChange}
          >
            <div className="container justify-start px-4 mt-4">
              <TabsList>
                <TabsTrigger value="dailyChecklist">Daily Checklist</TabsTrigger>
                <TabsTrigger value="maintenance">Weekly Maintenance</TabsTrigger>
                <TabsTrigger value="repairs">Firearms Repairs</TabsTrigger>
              </TabsList>
            </div>

            <div
              className={classNames(
                'grid flex-1 items-start mt-4 max-w-8xl w-full overflow-hidden',
                styles.noScroll
              )}
            >
              <ScrollArea className="h-[calc(100vh-5rem)] overflow-hidden relative">
                <div className="container px-4 mt-4">
                  <TabsContent value="dailyChecklist" className="mt-0">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                          <TextGenerateEffect words="Daily Checklist" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DailyChecklist
                          userRole={userRole}
                          userUuid={userUuid}
                          userName={userName}
                          onSubmit={handleDailyChecklistSubmit}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="maintenance" className="mt-0">
                    {/* <Card className="h-full"> */}
                    {/* <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        <TextGenerateEffect words={words} />
                      </CardTitle>
                    </CardHeader> */}
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        {['admin', 'super admin', 'dev'].includes(userRole || '') && (
                          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                            Add Firearm
                          </Button>
                        )}
                        <Button variant="outline" onClick={regenerateFirearmsList}>
                          Regenerate Firearms List
                        </Button>
                      </div>
                      <div className="border rounded-md">
                        {loading ? (
                          <p></p>
                        ) : (
                          userRole &&
                          userUuid && (
                            <>
                              <DataTable
                                columns={columns}
                                data={data}
                                userRole={userRole}
                                userUuid={userUuid}
                                onStatusChange={handleStatusChange}
                                onNotesChange={handleNotesChange}
                                onUpdateFrequency={handleUpdateFrequency}
                                onDeleteFirearm={handleDeleteFirearm}
                              />
                            </>
                          )
                        )}
                      </div>
                      <div className="container justify-start mt-4">
                        <Button
                          variant="ringHover"
                          onClick={handleSubmit}
                          className="w-full max-w-lg"
                        >
                          Submit Maintenance List
                        </Button>
                      </div>
                    </CardContent>
                    {/* </Card> */}
                  </TabsContent>

                  <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to submit the maintenance list?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit}>Submit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <TabsContent value="repairs" className="mt-0">
                    <div className="grid grid-cols-1">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-2xl font-bold">
                            <TextGenerateEffect words="Repairs" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <AllFirearmsList userRole={userRole} />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}
