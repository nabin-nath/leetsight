// components/ui/sidebar.tsx
"use client";
import { useState, useEffect } from "react";

interface SidebarProps {
  availableCompanies: string[];
  availableRoles: string[];
  onFiltersChange: (filters: {
    company: string;
    role: string;
    timePeriod: string;
  }) => void;
  onCompanySelectedForRoleFetch: (companyName: string) => void;
  initialFilters: { company: string; role: string; timePeriod: string };
  isLoadingRoles: boolean; // New prop
}

const Sidebar = ({
  availableCompanies,
  availableRoles,
  onFiltersChange,
  onCompanySelectedForRoleFetch,
  initialFilters,
  isLoadingRoles, // Use new prop
}: SidebarProps) => {
  const [selectedCompany, setSelectedCompany] = useState(
    initialFilters.company
  );
  const [selectedRole, setSelectedRole] = useState(initialFilters.role);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(
    initialFilters.timePeriod
  );

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompany = e.target.value;
    // console.log("Sidebar: handleCompanyChange - newCompany:", newCompany);
    setSelectedCompany(newCompany); // Update local state immediately
    // When company changes, the role should reset in the sidebar's view,
    // and the parent should be notified to fetch new roles.
    setSelectedRole("All Roles"); // Reset local role state
    onCompanySelectedForRoleFetch(newCompany); // Tell parent to fetch roles for this new company
  };

  const handleApplyFilters = () => {
    // console.log("Sidebar: handleApplyFilters clicked. Current selections:", {
    //   selectedCompany,
    //   selectedRole,
    //   selectedTimePeriod,
    // });
    onFiltersChange({
      company: selectedCompany,
      role: selectedRole,
      timePeriod: selectedTimePeriod,
    });
  };

  const isRoleFilterDisabled =
    selectedCompany === "All Companies" || isLoadingRoles;

  return (
    <div className="w-full md:w-72 shrink-0 rounded-lg bg-white p-4 md:h-[calc(100vh-80px)] sm:h-fit sm:w-full shadow-xl mb-4 md:mb-0 lg:ml-3">
      {" "}
      {/* Enhanced shadow */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
      <div className="space-y-6">
        {/* Company Filter */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Company
          </label>
          <select
            id="company"
            value={selectedCompany}
            onChange={(e) => handleCompanyChange(e)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 pl-3 pr-10"
          >
            {availableCompanies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <label
            htmlFor="role"
            className={`block text-sm font-medium mb-1 ${
              isRoleFilterDisabled ? "text-gray-400" : "text-gray-700"
            }`}
          >
            Role
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isRoleFilterDisabled}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 pl-3 pr-10 ${
              isRoleFilterDisabled
                ? "bg-gray-50 cursor-not-allowed"
                : "bg-white"
            }`}
          >
            {isLoadingRoles ? (
              <option>Loading roles...</option>
            ) : (
              availableRoles
                .filter((role) => role !== "N/A")
                .map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))
            )}
          </select>
        </div>

        {/* Time Period Filter */}
        <div>
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time Period
          </label>
          <select
            id="time"
            value={selectedTimePeriod}
            onChange={(e) => setSelectedTimePeriod(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 pl-3 pr-10"
          >
            <option value="Last Week">Last Week</option>
            <option value="Last Month">Last Month</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="All Time">All Time</option>{" "}
            {/* Add All Time option */}
          </select>
        </div>

        <button
          onClick={handleApplyFilters}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" // Enhanced button style
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
