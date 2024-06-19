"use client";
import React, { useState, Dispatch, SetStateAction, DragEvent, FormEvent, useEffect, useRef } from "react";
import { PlusIcon, TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { LinkBreak2Icon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase/client";

type ColumnType = {
  id: string;
  title: string;
};

type CardType = {
  id: string;
  title: string;
  column_name: string;
};

const CustomKanban = () => {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
      <Board />
    </div>
  );
};

export default function Board() {
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const channel = useRef(null);

  const fetchColumns = async () => {
    const { data, error } = await supabase.from("weekly_agenda_columns").select("*");
    if (error) {
      console.error("Error fetching columns:", error);
    } else {
      setColumns(data);
    }
  };

  const fetchCards = async () => {
    const { data, error } = await supabase.from("weekly_agenda").select("*");
    if (error) {
      console.error("Error fetching cards:", error);
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
      .insert([{ column_name, title }])
      .select();
    if (error) {
      console.error("Error adding card:", error);
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
      console.error("Error updating card column:", error);
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
      console.error("Error updating card title:", error);
    } else {
      fetchCards();
    }
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from("weekly_agenda").delete().eq("id", id);
    if (error) {
      console.error("Error deleting card:", error);
    } else {
      setCards((prevCards) => prevCards.filter((card) => card.id !== id));
    }
  };

  const addColumn = async (title: string) => {
    const { data, error } = await supabase
      .from("weekly_agenda_columns")
      .insert([{ title }])
      .select();
    if (error) {
      console.error("Error adding column:", error);
    } else {
      setColumns((prevColumns) => [...prevColumns, data[0]]);
    }
  };

  const updateColumnTitle = async (id: string, title: string) => {
    const { error } = await supabase
      .from("weekly_agenda_columns")
      .update({ title })
      .eq("id", id);
    if (error) {
      console.error("Error updating column title:", error);
    } else {
      fetchColumns();
    }
  };

  const deleteColumn = async (id: string) => {
    const { error } = await supabase.from("weekly_agenda_columns").delete().eq("id", id);
    if (error) {
      console.error("Error deleting column:", error);
    } else {
      setColumns((prevColumns) => prevColumns.filter((column) => column.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-3 overflow-scroll p-12">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Weekly Agenda</h1>
        <AddColumn handleAddColumn={addColumn} />
      </div>
      <div className="flex gap-3">
        {columns.map((column) => (
          <Column
            key={column.id}
            title={column.title}
            column={column}
            headingColor="text-neutral-500"
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
        <BurnBarrel setCards={setCards} />
      </div>
    </div>
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
  deleteCard: (id: string) => void;
  updateColumnTitle: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
};

const Column = ({ title, headingColor, cards, column, setCards, updateCardColumn, updateCardTitle, addCard, deleteCard, updateColumnTitle, deleteColumn }: ColumnProps) => {
  const [active, setActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

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
      document.querySelectorAll(`[data-column="${column.title}"]`) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const handleAddCard = async (title: string) => {
    await addCard(column.title, title);
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
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
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between group">
        {isEditing ? (
          <form onSubmit={handleColumnTitleSubmit} className="flex-1">
            <input
              type="text"
              value={newTitle}
              onChange={handleColumnTitleChange}
              className="w-full rounded border border-violet-400 bg-violet-400/20 p-1 text-sm text-neutral-50 focus:outline-0"
            />
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button type="submit" className="flex items-center gap-1.5 rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-950 transition-colors hover:bg-neutral-300">
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className={`font-medium ${headingColor}`}>{title}</h3>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleEditColumn} className="text-yellow-500">
                <Pencil1Icon />
              </button>
              <button onClick={() => deleteColumn(column.id)} className="text-red-500">
                <TrashIcon />
              </button>
            </div>
          </>
        )}
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full transition-colors ${active ? "bg-neutral-800/50" : "bg-neutral-800/0"}`}
      >
        {cards.map((c) => (
          <Card key={c.id} {...c} handleDragStart={handleDragStart} handleDeleteCard={handleDeleteCard} updateCardTitle={updateCardTitle} />
        ))}
        <DropIndicator beforeId={null} column_name={column.title} />
        <AddCard column_name={column.title} handleAddCard={handleAddCard} />
      </div>
    </div>
  );
};

type CardProps = CardType & {
  handleDragStart: Function;
  handleDeleteCard: (id: string) => void;
  updateCardTitle: (id: string, title: string) => void;
};

const Card = ({ title, id, column_name, handleDragStart, handleDeleteCard, updateCardTitle }: CardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

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
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing group"
      >
        {isEditing ? (
          <form onSubmit={handleTitleSubmit} className="flex-1">
            <input
              type="text"
              value={newTitle}
              onChange={handleTitleChange}
              className="w-full rounded border border-violet-400 bg-violet-400/20 p-1 text-sm text-neutral-50 focus:outline-0"
            />
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button type="submit" className="flex items-center gap-1.5 rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-950 transition-colors hover:bg-neutral-300">
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-100">{title}</p>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleEdit} className="text-yellow-500">
                <Pencil1Icon />
              </button>
              <button onClick={() => handleDeleteCard(id)} className="text-red-500">
                <TrashIcon />
              </button>
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

const BurnBarrel = ({ setCards }: { setCards: Dispatch<SetStateAction<CardType[]>> }) => {
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
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
        active ? "border-red-800 bg-red-800/20 text-red-500" : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <LinkBreak2Icon className="animate-bounce" /> : <TrashIcon />}
    </div>
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
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50">
              Close
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300">
              <span>Add</span>
              <PlusIcon />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button layout onClick={() => setAdding(true)} className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50">
          <span>Add card</span>
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
        <motion.form layout onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new column..."
            className="rounded border border-violet-400 bg-violet-400/20 p-1 text-sm text-neutral-50 focus:outline-0"
          />
          <div className="flex items-center gap-1.5">
            <button onClick={() => setAdding(false)} className="px-2 py-1 text-xs text-neutral-400 transition-colors hover:text-neutral-50">
              Close
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-950 transition-colors hover:bg-neutral-300">
              <span>Add</span>
              <PlusIcon />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button layout onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1 text-xs text-neutral-400 transition-colors hover:text-neutral-50">
          <span>Add column</span>
          <PlusIcon />
        </motion.button>
      )}
    </>
  );
};
