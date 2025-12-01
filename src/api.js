import axios from 'axios';

export const API_CONFIG = {
  PROD: 'https://polanyze-dev.azurewebsites.net/api',
  LOCAL: 'http://localhost:7071/api'
};

let currentBaseUrl = API_CONFIG.PROD;

export const setApiEnv = (env) => {
  currentBaseUrl = env === 'LOCAL' ? API_CONFIG.LOCAL : API_CONFIG.PROD;
  console.log(`Switched API to: ${currentBaseUrl}`);
};

// --- API CALLS ---

// NEW: Fetch all policies from backend
export const fetchPolicies = async () => {
  try {
    const response = await axios.get(`${currentBaseUrl}/get_all_policies`);
    return response.data;
  } catch (error) {
    console.error("Error fetching policies:", error);
    return [];
  }
};

export const searchPolicies = async (question) => {
  const response = await axios.post(`${currentBaseUrl}/query_policy`, { question });
  return response.data;
};

export const askDocument = async (docId, question) => {
  const response = await axios.post(`${currentBaseUrl}/query_document_details`, { 
    doc_id: docId, 
    question 
  });
  return response.data;
};

// Ingest Policy (Used for both New and Edit/Update)
export const ingestPolicy = async (formData) => {
  try {
    // formData should match the Python ingest_policy req_body structure
    // If formData contains 'series_id', the backend treats it as an update
    const response = await axios.post(`${currentBaseUrl}/ingest_policy`, formData);
    return response.data;
  } catch (error) {
    console.error("Ingest Error:", error);
    throw error;
  }
};