"use client";
import React, {
  useState,
  Dispatch,
  SetStateAction,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
} from "react";
import { PlusIcon, TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext"; // Adjust the import path if needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ColumnType = {
  id: string;
  title: string;
};

type CardType = {
  id: string;
  title: string;
  column_name: string;
  created_by: string; // Assuming you have a field that stores the creator's ID
};

const CustomKanban = () => {
  return (
    <div className="h-screen w-full">
      <Board />
    </div>
  );
};

export default function Board() {
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const channel = useRef(null);
  const { role, user } = useRole(); // Get the role and user from context

  const fetchColumns = async () => {
    const { data, error } = await supabase
      .from("weekly_agenda_columns")
      .select("*");
    if (error) {
      //console.("Error fetching columns:", error);
    } else {
      setColumns(data);
    }
  };

  const fetchCards = async () => {
    const { data, error } = await supabase.from("weekly_agenda").select("*");
    if (error) {
      //console.("Error fetching cards:", error);
    } else {
      setCards(data);
    }
  };

  useEffect(() => {
    fetchColumns();
    fetchCards();

    const WeeklyAgendaSubscription = supabase
      .channel("custom-weekly-agenda-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weekly_agenda" },
        (payload) => {
          fetchCards();
        }
      )
      .subscribe();

    const WeeklyAgendaColumnsSubscription = supabase
      .channel("custom-weekly-agenda-columns-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weekly_agenda_columns" },
        (payload) => {
          fetchColumns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(WeeklyAgendaSubscription);
      supabase.removeChannel(WeeklyAgendaColumnsSubscription);
    };
  }, []);

  const addCard = async (column_name: string, title: string) => {
    const { data, error } = await supabase
      .from("weekly_agenda")
      .insert([{ column_name, title, created_by: user.email }]) // Include created_by field
      .select();
    if (error) {
      //console.("Error adding card:", error);
    } else {
      setCards((prevCards) => [...prevCards, data[0]]);
    }
  };

  const updateCardColumn = async (id: string, column_name: string) => {
    const { error } = await supabase
      .from("weekly_agenda")
      .update({ column_name })
      .eq("id", id);
    if (error) {
      //console.("Error updating card column:", error);
    } else {
      fetchCards();
    }
  };

  const updateCardTitle = async (id: string, title: string) => {
    const { error } = await supabase
      .from("weekly_agenda")
      .update({ title })
      .eq("id", id);
    if (error) {
      //console.("Error updating card title:", error);
    } else {
      fetchCards();
    }
  };

  const deleteCard = async (id: string, createdBy: string) => {
    if (
      role === "super admin" ||
      role === "dev" ||
      (role === "admin" && user.email === createdBy)
    ) {
      const { error } = await supabase
        .from("weekly_agenda")
        .delete()
        .eq("id", id);
      if (error) {
        //console.("Error deleting card:", error);
      } else {
        setCards((prevCards) => prevCards.filter((card) => card.id !== id));
      }
    } else {
      //console.("You do not have permission to delete this card.");
    }
  };

  const addColumn = async (title: string) => {
    if (role === "super admin" || role === "dev") {
      const { data, error } = await supabase
        .from("weekly_agenda_columns")
        .insert([{ title }])
        .select();
      if (error) {
        //console.("Error adding column:", error);
      } else {
        setColumns((prevColumns) => [...prevColumns, data[0]]);
      }
    } else {
      //console.("You do not have permission to add columns.");
    }
  };

  const updateColumnTitle = async (id: string, title: string) => {
    const { error } = await supabase
      .from("weekly_agenda_columns")
      .update({ title })
      .eq("id", id);
    if (error) {
      //console.("Error updating column title:", error);
    } else {
      fetchColumns();
    }
  };

  const deleteColumn = async (id: string) => {
    if (role === "super admin" || role === "dev") {
      const { error } = await supabase
        .from("weekly_agenda_columns")
        .delete()
        .eq("id", id);
      if (error) {
        //console.("Error deleting column:", error);
      } else {
        setColumns((prevColumns) =>
          prevColumns.filter((column) => column.id !== id)
        );
      }
    } else {
      //console.("You do not have permission to delete this column.");
    }
  };

  return (
    <Card className="h-full mt-4">
      <CardHeader>
        <CardTitle>Weekly Agenda</CardTitle>
        {(role === "super admin" || role === "dev") && (
          <AddColumn handleAddColumn={addColumn} />
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              title={column.title}
              column={column}
              headingColor="text-black dark:text-white"
              cards={cards.filter((card) => card.column_name === column.title)}
              setCards={setCards}
              updateCardColumn={updateCardColumn}
              updateCardTitle={updateCardTitle}
              addCard={addCard}
              deleteCard={deleteCard}
              updateColumnTitle={updateColumnTitle}
              deleteColumn={deleteColumn}
            />
          ))}
        </div>
        <BurnBarrel setCards={setCards} />
      </CardContent>
    </Card>
  );
}

type ColumnProps = {
  title: string;
  headingColor: string;
  cards: CardType[];
  column: ColumnType;
  setCards: Dispatch<SetStateAction<CardType[]>>;
  updateCardColumn: (id: string, column_name: string) => void;
  updateCardTitle: (id: string, title: string) => void;
  addCard: (column_name: string, title: string) => void;
  deleteCard: (id: string, createdBy: string) => void; // Update prop type
  updateColumnTitle: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
};

const Column = ({
  title,
  headingColor,
  cards,
  column,
  setCards,
  updateCardColumn,
  updateCardTitle,
  addCard,
  deleteCard,
  updateColumnTitle,
  deleteColumn,
}: ColumnProps) => {
  const [active, setActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const { role, user } = useRole(); // Get the role from context

  const handleDragStart = (e: DragEvent, card: CardType) => {
    e.dataTransfer.setData("cardId", card.id);
    e.dataTransfer.setData("currentColumn", card.column_name);
  };

  const handleDrop = async (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    const currentColumn = e.dataTransfer.getData("currentColumn");

    if (currentColumn !== column.title) {
      await updateCardColumn(cardId, column.title);
      setCards((prevCards) => {
        const updatedCards = prevCards.map((card) =>
          card.id === cardId ? { ...card, column_name: column.title } : card
        );
        return updatedCards;
      });
    }
    setActive(false);
    clearHighlights();
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;
    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
    return el;
  };

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column.title}"]`
      ) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const handleAddCard = async (title: string) => {
    await addCard(column.title, title);
  };

  const handleDeleteCard = async (id: string, createdBy: string) => {
    await deleteCard(id, createdBy);
  };

  const handleEditColumn = () => {
    setIsEditing(true);
  };

  const handleColumnTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const handleColumnTitleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateColumnTitle(column.id, newTitle);
    setIsEditing(false);
  };

  return (
    <Card className="h-full max-w-sm">
      <CardContent className="h-full flex flex-col p-4">
        <div className="mb-3 flex items-center justify-between group">
          {isEditing ? (
            <form onSubmit={handleColumnTitleSubmit} className="flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={handleColumnTitleChange}
                className="w-full rounded border border-violet-400 bg-violet-400/20 p-1 text-sm focus:outline-0"
              />
              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded bg-neutral-50 px-2 py-1 text-xs transition-colors hover:bg-neutral-300"
                >
                  <span>Save</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className={`font-medium ${headingColor}`}>{title}</h3>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {(role === "super admin" || role === "dev") && (
                  <button
                    onClick={handleEditColumn}
                    className="text-yellow-500"
                  >
                    <Pencil1Icon />
                  </button>
                )}
                {(role === "super admin" || role === "dev") && (
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="text-red-500"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex-grow overflow-y-auto ${
            active ? "bg-neutral-800/50" : "bg-neutral-800/0"
          }`}
        >
          <div className="flex flex-col gap-2">
            {cards.map((c) => (
              <KanbanCard
                key={c.id}
                {...c}
                handleDragStart={handleDragStart}
                handleDeleteCard={handleDeleteCard}
                updateCardTitle={updateCardTitle}
              />
            ))}
            <DropIndicator beforeId={null} column_name={column.title} />
          </div>
        </div>
        <AddCard column_name={column.title} handleAddCard={handleAddCard} />
      </CardContent>
    </Card>
  );
};

type CardProps = CardType & {
  handleDragStart: Function;
  handleDeleteCard: (id: string, createdBy: string) => void; // Update prop type
  updateCardTitle: (id: string, title: string) => void;
};

const KanbanCard = ({
  title,
  id,
  column_name,
  created_by,
  handleDragStart,
  handleDeleteCard,
  updateCardTitle,
}: CardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const { role, user } = useRole(); // Get the role and user from context

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const handleTitleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateCardTitle(id, newTitle);
    setIsEditing(false);
  };

  return (
    <>
      <DropIndicator beforeId={id} column_name={column_name} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) => handleDragStart(e, { title, id, column_name })}
        className="cursor-grab rounded border border-neutral-700  p-3 active:cursor-grabbing group"
        data-before={id} // Add this line
      >
        {isEditing ? (
          <form onSubmit={handleTitleSubmit} className="flex-1">
            <input
              type="text"
              value={newTitle}
              onChange={handleTitleChange}
              className="w-full rounded border border-violet-400  p-1 text-sm  focus:outline-0"
            />
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded  px-2 py-1 text-xs  transition-colors hover:bg-neutral-300"
              >
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-sm ">{title}</p>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {(role === "super admin" ||
                (role === "dev" && user.email === created_by)) && (
                <button onClick={handleEdit} className="text-yellow-500">
                  <Pencil1Icon />
                </button>
              )}
              {(role === "super admin" ||
                (role === "dev" && user.email === created_by)) && (
                <button
                  onClick={() => handleDeleteCard(id, created_by)}
                  className="text-red-500"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

type DropIndicatorProps = {
  beforeId: string | null;
  column_name: string;
};

const DropIndicator = ({ beforeId, column_name }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column_name}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

const BurnBarrel = ({
  setCards,
}: {
  setCards: Dispatch<SetStateAction<CardType[]>>;
}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    setCards((pv) => pv.filter((c) => c.id !== cardId));
    setActive(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    ></div>
  );
};

type AddCardProps = {
  column_name: string;
  handleAddCard: (title: string) => void;
};

const AddCard = ({ column_name, handleAddCard }: AddCardProps) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim().length) return;
    await handleAddCard(text.trim());
    setAdding(false);
    setText(""); // Reset text after adding
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setText(e.target.value)}
            value={text} // Ensure value is controlled
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm  placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs  transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <Button
              variant="linkHover1"
              type="submit"
              className="flex items-center gap-1.5 rounded  px-3 py-1.5 text-xs  transition-colors hover:bg-neutral-600"
            >
              <span>Add</span>
              <PlusIcon />
            </Button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-50"
        >
          <span>Add Topic</span>
          <PlusIcon />
        </motion.button>
      )}
    </>
  );
};

type AddColumnProps = {
  handleAddColumn: (title: string) => void;
};

const AddColumn = ({ handleAddColumn }: AddColumnProps) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim().length) return;
    await handleAddColumn(text.trim());
    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form
          layout
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <input
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new column..."
            className="rounded border border-violet-400 bg-violet-400/20 p-1 text-sm  focus:outline-0"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-2 py-1 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <Button
              variant="linkHover1"
              type="submit"
              className="flex items-center gap-1.5 rounded  px-2 py-1 text-xs  transition-colors hover:bg-neutral-600"
            >
              <span>Add</span>
              <PlusIcon />
            </Button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add Staff</span>
          <PlusIcon />
        </motion.button>
      )}
    </>
  );
};

// "use client";

// import { useState, useEffect, useRef, FC } from "react";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragOverlay,
//   MeasuringStrategy,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   rectSortingStrategy,
//   verticalListSortingStrategy,
//   useSortable,
// } from "@dnd-kit/sortable";
// import SortableLinks from "@/components/SortableLinks";
// import SortableCard from "@/components/SortableCard"; // Import the new SortableCard component
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { AddNewItem } from "@/components/AddNewItem";
// import { RealtimeChannel } from "@supabase/supabase-js";
// import { useRole } from "@/context/RoleContext"; // Correct import
// import { supabase } from "@/utils/supabase/client";
// import { AddNewList } from "@/components/AddNewList";
// import { EditListTitle } from "@/components/EditListTitle";
// import RoleBasedWrapper from "@/components/RoleBasedWrapper";
// import { EditItem } from "@/components/EditItem";
// import { CSS } from "@dnd-kit/utilities";

// interface Item {
//   name: string;
//   id: number;
//   user_id: string;
//   user_name: string;
//   list_id: string;
// }

// interface List {
//   id: string;
//   title: string;
//   items: Item[];
// }

// interface SortableCardProps {
//   id: string;
//   children: React.ReactNode;
// }

// interface HomeProps {}

// const Todo: React.FC<HomeProps> = () => {
//   const { role, user } = useRole();
//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   const [lists, setLists] = useState<List[]>([]);
//   const [username, setUsername] = useState<string | null>(null);
//   const channel = useRef<RealtimeChannel | null>(null);
//   const [activeId, setActiveId] = useState<number | string | null>(null);
//   const [activeItem, setActiveItem] = useState<Item | null>(null);

//   useEffect(() => {
//     const fetchLists = async () => {
//       const { data: listData, error: listError } = await supabase
//         .from("lists")
//         .select("*");
//       if (listError) {
//         console.error("Error fetching lists:", listError);
//       } else if (listData) {
//         const { data: itemData, error: itemError } = await supabase
//           .from("items")
//           .select("*");
//         if (itemError) {
//           console.error("Error fetching items:", itemError);
//         } else if (itemData) {
//           const listsWithItems = listData.map((list: List) => ({
//             ...list,
//             items: itemData.filter((item: Item) => item.list_id === list.id),
//           }));
//           setLists(listsWithItems);
//         }
//       }
//     };

//     const fetchUsername = async () => {
//       if (user) {
//         const { data: userData, error } = await supabase
//           .from("employees")
//           .select("name")
//           .eq("user_uuid", user.id)
//           .single();
//         if (userData) {
//           setUsername(userData.name);
//         } else {
//           console.error("Error fetching username:", error?.message);
//         }
//       }
//     };

//     fetchLists();
//     fetchUsername();

//     if (!channel.current) {
//       channel.current = supabase.channel("public:items");

//       channel.current
//         .on(
//           "postgres_changes",
//           { event: "INSERT", schema: "public", table: "items" },
//           (payload) => {
//             setLists((prevLists) =>
//               prevLists.map((list) =>
//                 list.id === payload.new.list_id
//                   ? { ...list, items: [...list.items, payload.new as Item] }
//                   : list
//               )
//             );
//           }
//         )
//         .on(
//           "postgres_changes",
//           { event: "DELETE", schema: "public", table: "items" },
//           (payload) => {
//             setLists((prevLists) =>
//               prevLists.map((list) =>
//                 list.id === payload.old.list_id
//                   ? {
//                       ...list,
//                       items: list.items.filter(
//                         (item) => item.id !== payload.old.id
//                       ),
//                     }
//                   : list
//               )
//             );
//           }
//         )
//         .on(
//           "postgres_changes",
//           { event: "UPDATE", schema: "public", table: "items" },
//           (payload) => {
//             setLists((prevLists) =>
//               prevLists.map((list) =>
//                 list.id === payload.new.list_id
//                   ? {
//                       ...list,
//                       items: list.items.map((item) =>
//                         item.id === payload.new.id
//                           ? (payload.new as Item)
//                           : item
//                       ),
//                     }
//                   : list
//               )
//             );
//           }
//         )
//         .subscribe();
//     }

//     return () => {
//       channel.current?.unsubscribe();
//       channel.current = null;
//     };
//   }, [user]);

//   const SortableCard: React.FC<SortableCardProps> = ({ id, children }) => {
//     const { attributes, listeners, setNodeRef, transform, transition } =
//       useSortable({ id });

//     const style = {
//       transform: transform
//         ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
//         : undefined,
//       transition,
//     };

//     return (
//       <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
//         {children}
//       </div>
//     );
//   };

//   const handleDragStart = (event: any) => {
//     const { active } = event;
//     setActiveId(active.id);

//     const activeList = lists.find((list) => list.id === active.id);
//     if (activeList) {
//       setActiveItem(null);
//     } else {
//       const activeItem = lists
//         .map((list) => list.items)
//         .flat()
//         .find((item) => item.id === active.id);
//       setActiveItem(activeItem || null);
//     }
//   };

//   const handleDragEnd = (event: any) => {
//     const { active, over } = event;
//     setActiveId(null);
//     setActiveItem(null);

//     if (!over) return;

//     if (active.id !== over.id) {
//       setLists((prevLists) => {
//         const oldIndex = prevLists.findIndex((list) => list.id === active.id);
//         const newIndex = prevLists.findIndex((list) => list.id === over.id);

//         if (oldIndex !== -1 && newIndex !== -1) {
//           // This is a list being moved
//           return arrayMove(prevLists, oldIndex, newIndex);
//         } else {
//           // This is an item being moved
//           const activeContainer = findContainer(active.id);
//           const overContainer = findContainer(over.id);

//           if (activeContainer && overContainer) {
//             const activeList = prevLists.find(
//               (list) => list.id === activeContainer
//             );
//             const overList = prevLists.find(
//               (list) => list.id === overContainer
//             );

//             if (activeList && overList) {
//               if (activeContainer === overContainer) {
//                 // Moving within the same list
//                 const oldIndex = activeList.items.findIndex(
//                   (item) => item.id === active.id
//                 );
//                 const newIndex = activeList.items.findIndex(
//                   (item) => item.id === over.id
//                 );
//                 const newItems = arrayMove(
//                   activeList.items,
//                   oldIndex,
//                   newIndex
//                 );

//                 return prevLists.map((list) =>
//                   list.id === activeContainer
//                     ? { ...list, items: newItems }
//                     : list
//                 );
//               } else {
//                 // Moving between different lists
//                 const activeIndex = activeList.items.findIndex(
//                   (item) => item.id === active.id
//                 );
//                 const [movedItem] = activeList.items.splice(activeIndex, 1);
//                 const overIndex = overList.items.findIndex(
//                   (item) => item.id === over.id
//                 );
//                 overList.items.splice(overIndex, 0, movedItem);

//                 return prevLists.map((list) =>
//                   list.id === activeContainer
//                     ? { ...list, items: [...activeList.items] }
//                     : list.id === overContainer
//                     ? { ...list, items: [...overList.items] }
//                     : list
//                 );
//               }
//             }
//           }
//         }
//         return prevLists;
//       });
//     }
//   };

//   const findContainer = (id: number | string): string | undefined => {
//     for (const list of lists) {
//       if (list.id === id) {
//         return list.id;
//       }
//       if (list.items && list.items.some((item) => item.id === id)) {
//         return list.id;
//       }
//     }
//     return undefined;
//   };

//   const handleDelete = async (listId: string, idToDelete: number) => {
//     const list = lists.find((list) => list.id === listId);
//     const item = list?.items.find((item) => item.id === idToDelete);
//     if (item && item.user_id === user.id) {
//       const { error } = await supabase
//         .from("items")
//         .delete()
//         .eq("id", idToDelete);
//       if (error) {
//         console.error("Error deleting item:", error);
//       } else {
//         setLists((prevLists) =>
//           prevLists.map((list) =>
//             list.id === listId
//               ? {
//                   ...list,
//                   items: list.items.filter((item) => item.id !== idToDelete),
//                 }
//               : list
//           )
//         );
//       }
//     } else {
//       console.error("You do not have permission to delete this item.");
//     }
//   };

//   const addNewItem = async (listId: string, newItem: string) => {
//     if (!user || !username) {
//       console.error("User or username is not defined");
//       return;
//     }

//     const newItemData: Item = {
//       name: newItem,
//       id: Date.now(),
//       user_id: user.id,
//       user_name: username,
//       list_id: listId,
//     };
//     const { data, error } = await supabase.from("items").insert([newItemData]);
//     if (error) {
//       console.error("Error adding item:", error);
//     } else if (data) {
//       setLists((prevLists) =>
//         prevLists.map((list) =>
//           list.id === listId
//             ? { ...list, items: [...list.items, newItemData] }
//             : list
//         )
//       );
//     }
//   };

//   const addNewList = async (newListTitle: string) => {
//     const newListData = {
//       title: newListTitle,
//     };
//     const { data, error } = await supabase
//       .from("lists")
//       .insert([newListData])
//       .select("id"); // Explicitly select the id

//     if (error) {
//       console.error("Error adding list:", error);
//     } else if (data && data.length > 0) {
//       const newList = { id: data[0].id, title: newListTitle, items: [] };
//       setLists((prevLists) => [...prevLists, newList]);
//     }
//   };

//   const updateListTitle = async (id: string, title: string) => {
//     const { error } = await supabase
//       .from("lists")
//       .update({ title })
//       .eq("id", id);
//     if (error) {
//       console.error("Error updating list title:", error);
//     } else {
//       setLists((prevLists) =>
//         prevLists.map((list) => (list.id === id ? { ...list, title } : list))
//       );
//     }
//   };

//   const deleteList = async (id: string) => {
//     const { error: listError } = await supabase
//       .from("lists")
//       .delete()
//       .eq("id", id);
//     const { error: itemsError } = await supabase
//       .from("items")
//       .delete()
//       .eq("list_id", id);
//     if (listError || itemsError) {
//       console.error("Error deleting list:", listError || itemsError);
//     } else {
//       setLists((prevLists) => prevLists.filter((list) => list.id !== id));
//     }
//   };

//   const updateItem = async (id: number, updatedItem: Partial<Item>) => {
//     const { error } = await supabase
//       .from("items")
//       .update(updatedItem)
//       .eq("id", id);
//     if (error) {
//       console.error("Error updating item:", error);
//     } else {
//       setLists((prevLists) =>
//         prevLists.map((list) => ({
//           ...list,
//           items: list.items.map((item) =>
//             item.id === id ? { ...item, ...updatedItem } : item
//           ),
//         }))
//       );
//     }
//   };

//   return (
//     <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
//       <main className="flex grid-cols-4 justify-center mt-10 h-screen px-2 mx-auto select-none">
//         <div className="flex justify-start p-4 mb-4">
//           <AddNewList addNewList={addNewList} />
//         </div>
//         <div className="container mt-10 px-4 md:px-6">
//           <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3 md:grid-cols-3">
//             <DndContext
//               sensors={sensors}
//               collisionDetection={closestCenter}
//               onDragStart={handleDragStart}
//               onDragEnd={handleDragEnd}
//               measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
//             >
//               <SortableContext
//                 items={lists.map((list) => list.id)}
//                 strategy={rectSortingStrategy}
//               >
//                 {lists.map((list) => (
//                   <SortableCard key={list.id} id={list.id}>
//                     <Card className="w-full min-w-[325px] md:max-w-lg">
//                       <CardHeader className="space-y-1">
//                         <CardTitle className="text-2xl flex justify-between">
//                           {list.title}
//                           <EditListTitle
//                             list={list}
//                             updateListTitle={updateListTitle}
//                             deleteList={deleteList}
//                           />
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent className="grid gap-4">
//                         <SortableContext
//                           items={list.items.map((item) => item.id)}
//                           strategy={verticalListSortingStrategy}
//                         >
//                           {list.items.map((item) => (
//                             <div className="relative group" key={item.id}>
//                               <SortableLinks
//                                 item={item}
//                                 onDelete={(id: number | string) =>
//                                   handleDelete(list.id, id as number)
//                                 }
//                                 updateItem={updateItem}
//                               />
//                               <div className="absolute top-2 right-2 hidden group-hover:flex">
//                                 <EditItem
//                                   item={item}
//                                   updateItem={updateItem}
//                                   deleteItem={() =>
//                                     handleDelete(list.id, item.id)
//                                   }
//                                 />
//                               </div>
//                             </div>
//                           ))}
//                         </SortableContext>
//                         <AddNewItem
//                           addNewItem={(newItem: string) =>
//                             addNewItem(list.id, newItem)
//                           }
//                         />
//                       </CardContent>
//                     </Card>
//                   </SortableCard>
//                 ))}
//               </SortableContext>
//               <DragOverlay>
//                 {activeId ? (
//                   <SortableLinks
//                     item={{
//                       id: activeId as number,
//                       name: "",
//                       user_id: "",
//                       user_name: "",
//                       list_id: "",
//                     }}
//                     onDelete={() => {}}
//                     updateItem={() => {}}
//                   />
//                 ) : null}
//               </DragOverlay>
//             </DndContext>
//           </div>
//         </div>
//       </main>
//     </RoleBasedWrapper>
//   );
// };

// export default Todo;
