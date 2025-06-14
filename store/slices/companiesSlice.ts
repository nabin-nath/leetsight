import apiClient from "@/lib/apiClient";
import { CompanyOption } from "@/types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CompaniesState {
  items: CompanyOption[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CompaniesState = {
  items: [{ name: "All Companies", id: "1000" }],
  status: "idle",
  error: null,
};

export const fetchCompanies = createAsyncThunk<
  CompanyOption[],
  void,
  { rejectValue: string }
>("companies/fetchCompanies", async (_, { rejectWithValue, getState }) => {
  const { companies } = getState() as { companies: CompaniesState };
  try {
    const response = await apiClient.get<CompanyOption[]>("/companies"); // Assuming API returns CompanyOption[]
    if (response.status < 200 || response.status >= 300) {
      return rejectWithValue("Failed to fetch companies");
    }
    // Prepend "All Companies" to the fetched list
    return [{ name: "All Companies", id: "1000" }, ...response.data];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const companiesSlice = createSlice({
  name: "companies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        fetchCompanies.fulfilled,
        (state, action: PayloadAction<CompanyOption[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        }
      )
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch companies";
      });
  },
});

export default companiesSlice.reducer;
