// src/store/slices/rolesSlice.ts
import apiClient from "@/lib/apiClient";
import { RolesByCompany, RolesState } from "@/types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: RolesState = {}; // companyId: { roles: [], status: 'idle', error: null }

export const fetchRolesForCompany = createAsyncThunk<
  { companyId: string; roles: string[] }, // Fulfilled payload
  string, // Argument: companyId (as string)
  {
    rejectValue: { companyId: string; error: string };
    state: { roles: RolesState };
  }
>("roles/fetchForCompany", async (companyId, { rejectWithValue, getState }) => {
  // If companyId is "1000" (All Companies), return predefined "All Roles"
  if (companyId === "1000") {
    return { companyId, roles: ["All Roles"] };
  }

  const currentCompanyRoles = getState().roles[companyId];
  if (
    currentCompanyRoles &&
    (currentCompanyRoles.status === "succeeded" ||
      currentCompanyRoles.status === "loading")
  ) {
    // console.log(`Roles for company ${companyId} already fetched or loading. Skipping.`);
    // To satisfy thunk, we could return current roles, but this means components
    // must check status before dispatching for true "fetch once".
    // Here, we'll let it dispatch and components check status.
  }

  try {
    const response = await apiClient.get<string[]>(
      `/companies/${encodeURIComponent(companyId)}/roles`
    );
    if (response.status < 200 || response.status >= 300) {
      const errorData = response.data as any;
      return rejectWithValue({
        companyId,
        error: errorData.error || "Failed to fetch roles",
      });
    }
    const roles = [
      "All Roles",
      ...response.data.filter((role) => role && role !== "N/A").sort(),
    ];
    return { companyId, roles };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue({ companyId, error: message });
  }
});

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    // Action to reset roles for a company if it becomes invalid, or when "All Companies" is selected
    setRolesForCompany(
      state,
      action: PayloadAction<{ companyId: string; data: RolesByCompany }>
    ) {
      state[action.payload.companyId] = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRolesForCompany.pending, (state, action) => {
        const companyId = action.meta.arg;
        if (companyId !== "1000") {
          state[companyId] = {
            ...(state[companyId] || { roles: ["Loading..."] }), // Keep existing roles if any, or set to loading
            status: "loading",
            error: null,
          };
        }
      })
      .addCase(fetchRolesForCompany.fulfilled, (state, action) => {
        const { companyId, roles } = action.payload;
        state[companyId] = { roles, status: "succeeded", error: null };
      })
      .addCase(fetchRolesForCompany.rejected, (state, action) => {
        if (action.payload) {
          const { companyId, error } = action.payload;
          state[companyId] = {
            ...(state[companyId] || { roles: ["All Roles"] }), // Fallback to All Roles on error
            status: "failed",
            error,
          };
        }
      });
  },
});
export const { setRolesForCompany } = rolesSlice.actions;
export default rolesSlice.reducer;
