'use server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export type NoteItem = {
  id: string;
  content: string;
};

export type TeamMember = {
  note_id: number;
  employee_id: number;
  created_at: string;
  updated_at: string;
  range_notes: NoteItem[] | null;
  inventory_notes: NoteItem[] | null;
  store_notes: NoteItem[] | null;
  employees_notes: NoteItem[] | null;
  safety_notes: NoteItem[] | null;
  general_notes: NoteItem[] | null;
};

export type Employee = {
  employee_id: number;
  name: string;
  role: string;
};

export type DiscussedNote = {
  id: number;
  note_content: string;
  topic: string;
  employee_name: string;
  created_at: string;
  meeting_date: string;
};

export type DiscussedNotes = {
  meeting_date: string;
  notes: {
    [topic: string]: {
      content: string;
      employee_name: string;
    }[];
  };
};

export type NoteType =
  | 'range_notes'
  | 'inventory_notes'
  | 'store_notes'
  | 'employees_notes'
  | 'safety_notes'
  | 'general_notes';

const topics: NoteType[] = [
  'range_notes',
  'inventory_notes',
  'store_notes',
  'employees_notes',
  'safety_notes',
  'general_notes',
];

const topicDisplayNames: Record<NoteType, string> = {
  range_notes: 'Range',
  inventory_notes: 'Inventory',
  store_notes: 'Store',
  employees_notes: 'Employees',
  safety_notes: 'Safety',
  general_notes: 'General',
};

// Get current employee
export async function getCurrentEmployee(userId: string): Promise<Employee> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('employees')
    .select('employee_id, name, role')
    .eq('user_uuid', userId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Employee not found');

  return data as Employee;
}

// Get all team members
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('team_weekly_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as TeamMember[];
}

// Get all employees
export async function getEmployees(): Promise<Employee[]> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.from('employees').select('employee_id, name, role');

  if (error) throw new Error(error.message);
  return data as Employee[];
}

// Add new team member
export async function addTeamMember(
  newNotes: Omit<TeamMember, 'note_id' | 'created_at' | 'updated_at'>
): Promise<TeamMember> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.from('team_weekly_notes').insert([newNotes]).single();

  if (error) throw new Error(error.message);
  return data;
}

// Update team member notes
export async function updateTeamMemberNotes(member: TeamMember): Promise<TeamMember> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('team_weekly_notes')
    .update(member)
    .eq('note_id', member.note_id)
    .select() // Add select() to return the updated record
    .single(); // Ensure we get a single record back

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Team member not found');

  return data as TeamMember;
}

// Remove employee from team
export async function removeEmployee(employeeId: number): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from('team_weekly_notes').delete().eq('employee_id', employeeId);

  if (error) throw new Error(error.message);
  return true;
}

export async function markNoteAsDiscussed(
  noteContent: string,
  topic: keyof Pick<
    TeamMember,
    | 'range_notes'
    | 'inventory_notes'
    | 'store_notes'
    | 'employees_notes'
    | 'safety_notes'
    | 'general_notes'
  >,
  employeeId: number,
  employeeName: string,
  meetingDate: string
): Promise<DiscussedNote> {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // First, get the existing team member's notes using employee_id
    const { data: existingMember, error: fetchError } = await supabase
      .from('team_weekly_notes')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch team member: ${fetchError.message}`);
    if (!existingMember) throw new Error('Team member not found');

    // Insert into discussed_notes with the employee's name
    const { data: discussedNote, error: insertError } = await supabase
      .from('discussed_notes')
      .insert({
        note_content: noteContent,
        topic,
        employee_name: employeeName,
        meeting_date: meetingDate,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to insert discussed note: ${insertError.message}`);

    // Update team_weekly_notes by removing the discussed note
    const currentNotes = (existingMember[topic] as NoteItem[]) || [];
    const updatedNotes = currentNotes.filter((note) => note.content !== noteContent);

    const { error: updateError } = await supabase
      .from('team_weekly_notes')
      .update({ [topic]: updatedNotes })
      .eq('employee_id', employeeId);

    if (updateError) throw new Error(`Failed to update team notes: ${updateError.message}`);

    return discussedNote;
  } catch (error) {
    console.error('Error in markNoteAsDiscussed:', error);
    throw error;
  }
}

export async function getDiscussedNotes(): Promise<DiscussedNote[]> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('discussed_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function dismissNote(
  memberId: number,
  topic: keyof Pick<
    TeamMember,
    | 'range_notes'
    | 'inventory_notes'
    | 'store_notes'
    | 'employees_notes'
    | 'safety_notes'
    | 'general_notes'
  >,
  noteId: string
): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: member } = await supabase
    .from('team_weekly_notes')
    .select(topic)
    .eq('note_id', memberId)
    .single();

  if (!member) throw new Error('Note not found');

  const notes = (member as Record<string, NoteItem[]>)[topic] ?? [];
  const updatedNotes = notes.filter((note: NoteItem) => note.id !== noteId);

  const { error } = await supabase
    .from('team_weekly_notes')
    .update({ [topic]: updatedNotes })
    .eq('note_id', memberId);

  if (error) throw new Error(error.message);
}

export async function removeDiscussedNote(noteId: number): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from('discussed_notes').delete().eq('id', noteId);

  if (error) throw new Error(error.message);
}
