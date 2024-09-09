import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import { useEffect, useState } from "react";

import CareIcon from "../../../CAREUI/icons/CareIcon";
import { DropdownTransition } from "../../Common/components/HelperComponents";
import FormField from "./FormField";
import { classNames } from "../../../Utils/utils";
import { dropdownOptionClassNames } from "../MultiSelectMenuV2";
import { useTranslation } from "react-i18next";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteFormFieldProps<T, V> = FormFieldBaseProps<V> & {
  placeholder?: string;
  options: readonly T[];
  optionLabel: OptionCallback<T, string>;
  optionValue?: OptionCallback<T, V>;
  optionDescription?: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionDisabled?: OptionCallback<T, boolean>;
  minQueryLength?: number;
  onQuery?: (query: string) => void;
  dropdownIcon?: React.ReactNode | undefined;
  isLoading?: boolean;
  allowRawInput?: boolean;
  error?: string;
};

const AutocompleteFormField = <T, V>(
  props: AutocompleteFormFieldProps<T, V>,
) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        required={field.required}
        className={field.className}
        value={field.value}
        onChange={(value: any) => field.handleChange(value)}
        options={props.options}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        optionIcon={props.optionIcon}
        optionValue={props.optionValue}
        optionDescription={props.optionDescription}
        optionDisabled={props.optionDisabled}
        minQueryLength={props.minQueryLength}
        onQuery={props.onQuery}
        isLoading={props.isLoading}
        allowRawInput={props.allowRawInput}
        error={field.error}
        requiredError={field.error ? props.required : false}
      />
    </FormField>
  );
};

export default AutocompleteFormField;

type AutocompleteProps<T, V = T> = {
  id?: string;
  options: readonly T[];
  disabled?: boolean | undefined;
  value: V | undefined;
  placeholder?: string;
  optionLabel: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionDisabled?: OptionCallback<T, boolean>;
  className?: string;
  minQueryLength?: number;
  onQuery?: (query: string) => void;
  requiredError?: boolean;
  isLoading?: boolean;
  allowRawInput?: boolean;
  error?: string;
} & (
  | {
      required?: false;
      onChange: OptionCallback<V | undefined, void>;
    }
  | {
      required: true;
      onChange: OptionCallback<V, void>;
    }
);

/**
 * Avoid using this component directly. Use `AutocompleteFormField` instead as
 * its API is easier to use and compliant with `FormField` based components.
 *
 * Use this only when you want to hack into the design and get more
 * customizability.
 */
export const Autocomplete = <T, V>(props: AutocompleteProps<T, V>) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(""); // Ensure lower case

  useEffect(() => {
    props.onQuery?.(query);
  }, [query]);

  const mappedOptions = props.options.map((option) => {
    const label = props.optionLabel(option);
    const description = props.optionDescription?.(option);
    return {
      label,
      description,
      search: label.toLowerCase(),
      icon: props.optionIcon?.(option),
      value: props.optionValue ? props.optionValue(option) : option,
      disabled: props.optionDisabled?.(option),
    };
  });

  const getOptions = () => {
    if (!query) return mappedOptions;

    const knownOption = mappedOptions.find(
      (o) => o.value == props.value || o.label == props.value,
    );

    if (knownOption) return mappedOptions;
    return [
      {
        label: query,
        description: undefined,
        search: query.toLowerCase(),
        icon: <CareIcon icon="l-plus" />,
        value: query,
        disabled: undefined,
      },
      ...mappedOptions,
    ];
  };

  const options = props.allowRawInput ? getOptions() : mappedOptions;

  const value = options.find((o) => props.value == o.value);

  const filteredOptions =
    props.onQuery === undefined
      ? options.filter((o) => o.search.includes(query))
      : options;

  return (
    <div
      className={
        props.requiredError || props.error
          ? "rounded border border-red-500 " + props.className
          : props.className
      }
      id={props.id}
    >
      <Combobox
        disabled={props.disabled}
        value={(value ?? props.placeholder ?? "Select") as T}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        <div className="relative">
          <div className="flex">
            <ComboboxInput
              className="cui-input-base truncate pr-16"
              placeholder={props.placeholder ?? "Select"}
              displayValue={(value: any) => value?.label || ""}
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
              onBlur={() => value && setQuery("")}
              autoComplete="off"
            />
            {!props.disabled && (
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                <div className="absolute right-0 top-1 mr-2 flex h-full items-center gap-1 pb-2 text-lg text-secondary-900">
                  <span>{value?.icon}</span>

                  {value && !props.isLoading && !props.required && (
                    <div className="tooltip" id="clear-button">
                      <CareIcon
                        icon="l-times-circle"
                        className="h-4 w-4 text-secondary-800 transition-colors duration-200 ease-in-out hover:text-secondary-500"
                        onClick={(e) => {
                          e.preventDefault();
                          props.onChange(undefined);
                        }}
                      />
                      <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-xs">
                        {t("clear_selection")}
                      </span>
                    </div>
                  )}

                  {props.isLoading ? (
                    <CareIcon icon="l-spinner" className="animate-spin" />
                  ) : (
                    <CareIcon id="dropdown-toggle" icon="l-angle-down" />
                  )}
                </div>
              </ComboboxButton>
            )}
          </div>

          <DropdownTransition>
            <ComboboxOptions
              modal={false}
              as="ul"
              className="cui-dropdown-base absolute z-10 mt-0.5 origin-top-right"
            >
              {props.minQueryLength && query.length < props.minQueryLength ? (
                <div className="p-2 text-sm text-secondary-500">
                  {`Please enter at least ${props.minQueryLength} characters to search`}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-secondary-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <ComboboxOption
                    as="li"
                    id={`${props.id}-option-${option.label}-value-${index}`}
                    key={`${props.id}-option-${option.label}-value-${index}`}
                    className={dropdownOptionClassNames}
                    value={option}
                    disabled={option.disabled}
                  >
                    {({ focus }) => (
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <span>{option.label}</span>
                          <span>{option.icon}</span>
                        </div>
                        {option.description && (
                          <div
                            className={classNames(
                              "text-sm font-normal",
                              option.disabled
                                ? "text-secondary-700"
                                : focus
                                  ? "text-primary-200"
                                  : "text-secondary-700",
                            )}
                          >
                            {option.description}
                          </div>
                        )}
                      </div>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </DropdownTransition>
        </div>
      </Combobox>
    </div>
  );
};
