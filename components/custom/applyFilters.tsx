"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePickerWithRange } from "../ui/DatePickerWithRange";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

const FormSchema = z.object({
  company: z.string(), // Company ID string
  role: z.string(),
  pageSize: z.string(),
});

interface CompanyOption {
  name: string;
  id: string | number;
}

interface ApplyFiltersCardProps {
  availableCompanies: CompanyOption[];
  availableRoles: string[];
  initialFilters: {
    companyId: string;
    role: string;
    pageSize: string;
    fromDate?: Date;
    toDate?: Date;
  };
  isLoadingRoles: boolean;
  onFiltersChange: (filters: {
    companyId: string;
    role: string;
    pageSize: string;
    fromDate?: Date;
    toDate?: Date;
  }) => void;
  onCompanySelectedForRoleFetch: (companyId: string) => void; // Accepts company ID string
}

export function ApplyFiltersCard({
  availableCompanies,
  availableRoles,
  initialFilters,
  isLoadingRoles,
  onFiltersChange,
  onCompanySelectedForRoleFetch,
}: ApplyFiltersCardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      company: initialFilters.companyId || "1000",
      role: initialFilters.role || "All Roles",
      pageSize: initialFilters.pageSize || "10",
    },
  });

  const { reset, watch } = form;

  // --- Synchronization Effect ---
  useEffect(() => {
    // console.log(
    //   "ApplyFiltersCard: Syncing form state with initialFilters:",
    //   initialFilters
    // );
    reset({
      company: initialFilters.companyId,
      role: initialFilters.role,
      pageSize: initialFilters.pageSize,
    });
    setDateRange({ from: initialFilters.fromDate, to: initialFilters.toDate });
  }, [initialFilters, reset]); // Dependencies

  const watchCompany = watch("company");

  // --- Effect to fetch roles when company filter changes in form ---
  useEffect(() => {
    // console.log(
    //   "ApplyFiltersCard: Company filter changed in form:",
    //   watchCompany
    // );

    // Reset role to "All Roles" whenever the company selection changes,
    // unless the new company is "All Companies" AND the role was already "All Roles".
    // Use { shouldValidate: false, shouldDirty: false, shouldTouch: false }
    // to minimize side effects during this state update.
    if (
      watchCompany !== "1000" ||
      (watchCompany === "1000" && form.getValues("role") !== "All Roles")
    ) {
      form.setValue("role", "All Roles", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
    }

    // Trigger role fetch if a specific company ID is selected
    if (watchCompany && watchCompany !== "1000") {
      // console.log(
      //   "ApplyFiltersCard: Triggering parent role fetch for company ID:",
      //   watchCompany
      // );
      onCompanySelectedForRoleFetch(watchCompany); // Pass the company ID string
    } else if (watchCompany === "1000") {
      // console.log(
      //   "ApplyFiltersCard: 'All Companies' selected, roles will be 'All Roles'."
      // );
      // The parent component handles setting availableRoles state to ["All Roles"]
      // when companyId is "1000", this state will propagate down via props.
    }
  }, [watchCompany, form, onCompanySelectedForRoleFetch]); // Dependencies

  // --- Submit Handler ---
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    // console.log("ApplyFiltersCard: Form submitted with data:", data);

    onFiltersChange({
      companyId: data.company, // company field holds the ID string
      role: data.role,
      pageSize: data.pageSize,
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
    });
  };

  const initialCalendarMonth =
    dateRange?.from || initialFilters.fromDate || new Date();

  return (
    <div className="mb-4 mt-5">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex items-end flex-wrap gap-4"
        >
          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Company</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? availableCompanies.find(
                              (company) => company.id == field.value
                            )?.name
                          : "Select company"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search company..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No Company found</CommandEmpty>
                        <CommandGroup>
                          {availableCompanies.map((company) => (
                            <CommandItem
                              value={String(company.name)}
                              key={company.id}
                              onSelect={() => {
                                form.setValue("company", String(company.id));
                              }}
                            >
                              {company.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  company.name === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={watchCompany === "1000" || isLoadingRoles}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value="loading" disabled>
                        Loading roles...
                      </SelectItem>
                    ) : (
                      availableRoles
                        .filter((role) => role && role !== "N/A")
                        .map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Range (using local state) */}
          <FormItem className="flex flex-col">
            <FormLabel>Date Range</FormLabel>
            <DatePickerWithRange
              value={dateRange}
              onChange={setDateRange}
              initialMonth={initialCalendarMonth}
            />
          </FormItem>

          {/* Page Size */}
          <FormField
            control={form.control}
            name="pageSize"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Page Size</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Apply Button */}
          <Button type="submit" className="md:mt-auto">
            Apply Filters
          </Button>
        </form>
      </Form>
    </div>
  );
}
