export interface Item {
    name: string;
    id: number;
    user_id: string;
    user_name: string;
    list_id: string;
  }
  
  export interface List {
    id: string;
    title: string;
    items: Item[];
  }
  