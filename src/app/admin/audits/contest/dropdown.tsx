import React, { useState } from "react";

type OptionType = {
  value: string;
  label: string | null;
};

type RenderDropdownProps = {
  field: any;
  options: OptionType[];
  placeholder: string;
};

const RenderDropdown: React.FC<RenderDropdownProps> = ({
  field,
  options,
  placeholder,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredOptions = options.filter((option) =>
    option.label?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="flex flex-col mb-4 w-full">
      <input
        type="text"
        className="border border-gray-300 rounded-md p-2 mb-2"
        placeholder={`Search ${placeholder}`}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <select
        {...field}
        className="border border-gray-300 rounded-md p-2"
        onChange={(e) => field.onChange(e.target.value)}
      >
        <option value="" disabled selected>
          {placeholder}
        </option>
        {filteredOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export { RenderDropdown };
