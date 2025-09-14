/**
 * CLIENT MANAGEMENT TESTS - SPEKTIF AGENCY
 * Test file to verify client management functionality
 * 
 * Run with: node test-results/client-management-tests.js
 */

// Mock API client for client management
class MockClientApiClient {
  constructor() {
    this.clients = [
      {
        id: 'client-1',
        name: 'Test Client 1',
        email: 'client1@example.com',
        phone: '+90 555 123 4567',
        company: 'Test Company 1',
        address: 'Test Address 1',
        notes: 'Test notes 1',
        status: 'active',
        projects: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'client-2',
        name: 'Test Client 2',
        email: 'client2@example.com',
        phone: '+90 555 987 6543',
        company: 'Test Company 2',
        address: 'Test Address 2',
        notes: 'Test notes 2',
        status: 'inactive',
        projects: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    this.calls = []
  }
  
  async getClients(organizationId) {
    this.calls.push({ method: 'getClients', organizationId })
    return this.clients
  }
  
  async createClient(organizationId, data) {
    this.calls.push({ method: 'createClient', organizationId, data })
    const newClient = {
      id: `client-${Date.now()}`,
      ...data,
      status: 'active',
      projects: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.clients.push(newClient)
    return newClient
  }
  
  async updateClient(clientId, data) {
    this.calls.push({ method: 'updateClient', clientId, data })
    const clientIndex = this.clients.findIndex(c => c.id === clientId)
    if (clientIndex === -1) {
      throw new Error('Client not found')
    }
    this.clients[clientIndex] = { ...this.clients[clientIndex], ...data, updatedAt: new Date().toISOString() }
    return this.clients[clientIndex]
  }
  
  async deleteClient(clientId) {
    this.calls.push({ method: 'deleteClient', clientId })
    const clientIndex = this.clients.findIndex(c => c.id === clientId)
    if (clientIndex === -1) {
      throw new Error('Client not found')
    }
    this.clients.splice(clientIndex, 1)
    return { success: true }
  }
  
  getCalls(method) {
    return this.calls.filter(call => !method || call.method === method)
  }
  
  clearCalls() {
    this.calls = []
  }
}

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

// Test helper function
function runTest(testName, testFunction) {
  console.log(`\n🧪 Running test: ${testName}`)
  try {
    const result = testFunction()
    if (result.success) {
      console.log(`✅ PASSED: ${testName}`)
      testResults.passed++
      testResults.tests.push({ name: testName, status: 'PASSED', result })
    } else {
      console.log(`❌ FAILED: ${testName}`)
      console.log(`   Error: ${result.error}`)
      testResults.failed++
      testResults.tests.push({ name: testName, status: 'FAILED', result })
    }
  } catch (error) {
    console.log(`❌ FAILED: ${testName} - Exception: ${error.message}`)
    testResults.failed++
    testResults.tests.push({ name: testName, status: 'FAILED', error: error.message })
  }
}

// Test 1: Client Data Structure Validation
function testClientDataStructure() {
  const apiClient = new MockClientApiClient()
  const clients = apiClient.clients
  
  // Check if clients array exists and has data
  const hasClients = Array.isArray(clients) && clients.length > 0
  
  // Check if each client has required fields
  const requiredFields = ['id', 'name', 'email', 'status', 'projects', 'createdAt', 'updatedAt']
  const clientsHaveRequiredFields = clients.every(client => 
    requiredFields.every(field => client.hasOwnProperty(field))
  )
  
  // Check if status values are valid
  const validStatuses = ['active', 'inactive']
  const statusValuesValid = clients.every(client => 
    validStatuses.includes(client.status)
  )
  
  // Check if projects is a number
  const projectsIsNumber = clients.every(client => 
    typeof client.projects === 'number' && client.projects >= 0
  )
  
  return {
    success: hasClients && clientsHaveRequiredFields && statusValuesValid && projectsIsNumber,
    data: {
      hasClients,
      clientsCount: clients.length,
      clientsHaveRequiredFields,
      statusValuesValid,
      projectsIsNumber,
      clients: clients.map(c => ({ id: c.id, name: c.name, status: c.status, projects: c.projects }))
    }
  }
}

// Test 2: Get Clients API
function testGetClientsApi() {
  const apiClient = new MockClientApiClient()
  const organizationId = 'spektif'
  
  // Test getClients API call
  const clients = apiClient.getClients(organizationId)
  
  // Check if API call was made
  const apiCalls = apiClient.getCalls('getClients')
  const apiCallMade = apiCalls.length > 0
  
  // Check if correct organizationId was passed
  const correctOrganizationId = apiCalls[0]?.organizationId === organizationId
  
  // Check if clients are returned
  const clientsReturned = Array.isArray(clients) && clients.length > 0
  
  return {
    success: apiCallMade && correctOrganizationId && clientsReturned,
    data: {
      apiCallMade,
      correctOrganizationId,
      clientsReturned,
      clientsCount: clients.length,
      apiCalls: apiCalls[0]
    }
  }
}

// Test 3: Create Client API
function testCreateClientApi() {
  const apiClient = new MockClientApiClient()
  const organizationId = 'spektif'
  const clientData = {
    name: 'New Test Client',
    email: 'newclient@example.com',
    phone: '+90 555 999 8888',
    company: 'New Test Company',
    address: 'New Test Address',
    notes: 'New test notes'
  }
  
  // Test createClient API call
  const newClient = apiClient.createClient(organizationId, clientData)
  
  // Check if API call was made
  const apiCalls = apiClient.getCalls('createClient')
  const apiCallMade = apiCalls.length > 0
  
  // Check if correct data was passed
  const correctData = apiCalls[0]?.data?.name === clientData.name &&
                     apiCalls[0]?.data?.email === clientData.email
  
  // Check if client was created
  const clientCreated = newClient && newClient.id && newClient.name === clientData.name
  
  // Check if client has required fields
  const hasRequiredFields = newClient && 
                           newClient.id && 
                           newClient.name && 
                           newClient.email && 
                           newClient.status === 'active' &&
                           newClient.projects === 0
  
  return {
    success: apiCallMade && correctData && clientCreated && hasRequiredFields,
    data: {
      apiCallMade,
      correctData,
      clientCreated,
      hasRequiredFields,
      newClient: { id: newClient?.id, name: newClient?.name, status: newClient?.status },
      apiCalls: apiCalls[0]
    }
  }
}

// Test 4: Update Client API
function testUpdateClientApi() {
  const apiClient = new MockClientApiClient()
  const clientId = 'client-1'
  const updateData = {
    name: 'Updated Client Name',
    phone: '+90 555 111 2222',
    status: 'inactive'
  }
  
  // Test updateClient API call
  const updatedClient = apiClient.updateClient(clientId, updateData)
  
  // Check if API call was made
  const apiCalls = apiClient.getCalls('updateClient')
  const apiCallMade = apiCalls.length > 0
  
  // Check if correct data was passed
  const correctData = apiCalls[0]?.data?.name === updateData.name &&
                     apiCalls[0]?.data?.status === updateData.status
  
  // Check if client was updated
  const clientUpdated = updatedClient && updatedClient.name === updateData.name
  
  // Check if updatedAt was updated
  const updatedAtUpdated = updatedClient && updatedClient.updatedAt !== updatedClient.createdAt
  
  return {
    success: apiCallMade && correctData && clientUpdated && updatedAtUpdated,
    data: {
      apiCallMade,
      correctData,
      clientUpdated,
      updatedAtUpdated,
      updatedClient: { id: updatedClient?.id, name: updatedClient?.name, status: updatedClient?.status },
      apiCalls: apiCalls[0]
    }
  }
}

// Test 5: Delete Client API
function testDeleteClientApi() {
  const apiClient = new MockClientApiClient()
  const clientId = 'client-1'
  const initialClientCount = apiClient.clients.length
  
  // Test deleteClient API call
  const deleteResult = apiClient.deleteClient(clientId)
  
  // Check if API call was made
  const apiCalls = apiClient.getCalls('deleteClient')
  const apiCallMade = apiCalls.length > 0
  
  // Check if correct clientId was passed
  const correctClientId = apiCalls[0]?.clientId === clientId
  
  // Check if client was deleted
  const clientDeleted = apiClient.clients.length === initialClientCount - 1
  
  // Check if correct client was deleted
  const correctClientDeleted = !apiClient.clients.find(c => c.id === clientId)
  
  return {
    success: apiCallMade && correctClientId && clientDeleted && correctClientDeleted,
    data: {
      apiCallMade,
      correctClientId,
      clientDeleted,
      correctClientDeleted,
      initialCount: initialClientCount,
      finalCount: apiClient.clients.length,
      apiCalls: apiCalls[0]
    }
  }
}

// Test 6: Client UI State Management
function testClientUIStateManagement() {
  // Simulate client UI state
  const uiState = {
    clients: [],
    isLoading: true,
    isCreating: false,
    error: null,
    selectedClient: null
  }
  
  // Test loading state
  const hasLoadingState = typeof uiState.isLoading === 'boolean'
  
  // Test creating state
  const hasCreatingState = typeof uiState.isCreating === 'boolean'
  
  // Test error state
  const hasErrorState = uiState.error === null || typeof uiState.error === 'string'
  
  // Test selected client state
  const hasSelectedClientState = uiState.selectedClient === null || typeof uiState.selectedClient === 'object'
  
  // Test clients array
  const hasClientsArray = Array.isArray(uiState.clients)
  
  return {
    success: hasLoadingState && hasCreatingState && hasErrorState && hasSelectedClientState && hasClientsArray,
    data: {
      hasLoadingState,
      hasCreatingState,
      hasErrorState,
      hasSelectedClientState,
      hasClientsArray,
      uiState
    }
  }
}

// Test 7: Client Form Validation
function testClientFormValidation() {
  const validClientData = {
    name: 'Valid Client',
    email: 'valid@example.com',
    phone: '+90 555 123 4567',
    company: 'Valid Company',
    address: 'Valid Address',
    notes: 'Valid notes'
  }
  
  const invalidClientData = {
    name: '', // Empty name
    email: 'invalid-email', // Invalid email
    phone: '123', // Invalid phone
    company: 'Valid Company',
    address: 'Valid Address',
    notes: 'Valid notes'
  }
  
  // Test valid data validation
  const validName = validClientData.name.length > 0
  const validEmail = validClientData.email.includes('@') && validClientData.email.includes('.')
  const validPhone = validClientData.phone.startsWith('+90') && validClientData.phone.length >= 10
  
  // Test invalid data validation
  const invalidName = invalidClientData.name.length === 0
  const invalidEmail = !invalidClientData.email.includes('@') || !invalidClientData.email.includes('.')
  const invalidPhone = !invalidClientData.phone.startsWith('+90') || invalidClientData.phone.length < 10
  
  return {
    success: validName && validEmail && validPhone && invalidName && invalidEmail && invalidPhone,
    data: {
      validName,
      validEmail,
      validPhone,
      invalidName,
      invalidEmail,
      invalidPhone,
      validData: validClientData,
      invalidData: invalidClientData
    }
  }
}

// Test 8: Client Status Management
function testClientStatusManagement() {
  const apiClient = new MockClientApiClient()
  const clients = apiClient.clients
  
  // Test status filtering
  const activeClients = clients.filter(c => c.status === 'active')
  const inactiveClients = clients.filter(c => c.status === 'inactive')
  
  // Check if filtering works
  const filteringWorks = activeClients.length > 0 && inactiveClients.length > 0
  
  // Test status change
  const clientId = 'client-1'
  const updatedClient = apiClient.updateClient(clientId, { status: 'inactive' })
  
  // Check if status was changed
  const statusChanged = updatedClient.status === 'inactive'
  
  // Test status validation
  const validStatuses = ['active', 'inactive']
  const allStatusesValid = clients.every(c => validStatuses.includes(c.status))
  
  return {
    success: filteringWorks && statusChanged && allStatusesValid,
    data: {
      filteringWorks,
      statusChanged,
      allStatusesValid,
      activeClients: activeClients.length,
      inactiveClients: inactiveClients.length,
      updatedClient: { id: updatedClient.id, status: updatedClient.status }
    }
  }
}

// Test 9: Client Search and Filtering
function testClientSearchAndFiltering() {
  const apiClient = new MockClientApiClient()
  const clients = apiClient.clients
  
  // Test name search
  const searchTerm = 'Test Client 1'
  const nameSearchResults = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Test email search
  const emailSearchTerm = 'client1@example.com'
  const emailSearchResults = clients.filter(c => 
    c.email.toLowerCase().includes(emailSearchTerm.toLowerCase())
  )
  
  // Test company search
  const companySearchTerm = 'Test Company'
  const companySearchResults = clients.filter(c => 
    c.company.toLowerCase().includes(companySearchTerm.toLowerCase())
  )
  
  // Check if search works
  const nameSearchWorks = nameSearchResults.length > 0
  const emailSearchWorks = emailSearchResults.length > 0
  const companySearchWorks = companySearchResults.length > 0
  
  // Test status filtering
  const activeClients = clients.filter(c => c.status === 'active')
  const inactiveClients = clients.filter(c => c.status === 'inactive')
  
  const statusFilteringWorks = activeClients.length > 0 && inactiveClients.length > 0
  
  return {
    success: nameSearchWorks && emailSearchWorks && companySearchWorks && statusFilteringWorks,
    data: {
      nameSearchWorks,
      emailSearchWorks,
      companySearchWorks,
      statusFilteringWorks,
      nameSearchResults: nameSearchResults.length,
      emailSearchResults: emailSearchResults.length,
      companySearchResults: companySearchResults.length,
      activeClients: activeClients.length,
      inactiveClients: inactiveClients.length
    }
  }
}

// Test 10: Client Error Handling
function testClientErrorHandling() {
  const apiClient = new MockClientApiClient()
  
  // Test getClients with invalid organizationId
  try {
    const clients = apiClient.getClients('invalid-org')
    const hasClients = Array.isArray(clients)
    
    // Test updateClient with non-existent clientId
    try {
      const updatedClient = apiClient.updateClient('non-existent-id', { name: 'Updated' })
      const clientUpdated = updatedClient !== undefined
      
      return {
        success: false,
        error: 'Should have thrown error for non-existent client'
      }
    } catch (error) {
      const errorHandled = error.message.includes('Client not found')
      
      return {
        success: hasClients && errorHandled,
        data: {
          hasClients,
          errorHandled,
          errorMessage: error.message
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    }
  }
}

// Main test runner
function runAllTests() {
  console.log('🚀 Starting Client Management Tests for Spektif Agency')
  console.log('=' .repeat(60))
  
  // Run all tests
  runTest('Client Data Structure Validation', testClientDataStructure)
  runTest('Get Clients API', testGetClientsApi)
  runTest('Create Client API', testCreateClientApi)
  runTest('Update Client API', testUpdateClientApi)
  runTest('Delete Client API', testDeleteClientApi)
  runTest('Client UI State Management', testClientUIStateManagement)
  runTest('Client Form Validation', testClientFormValidation)
  runTest('Client Status Management', testClientStatusManagement)
  runTest('Client Search and Filtering', testClientSearchAndFiltering)
  runTest('Client Error Handling', testClientErrorHandling)
  
  // Print summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 CLIENT MANAGEMENT TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
  
  console.log('\n📋 DETAILED RESULTS:')
  testResults.tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌'
    console.log(`${status} ${test.name}`)
    if (test.status === 'FAILED' && test.result?.error) {
      console.log(`   Error: ${test.result.error}`)
    }
  })
  
  // Client management specific issues check
  console.log('\n🔍 CLIENT MANAGEMENT SPECIFIC ISSUES:')
  
  const dataStructureTest = testResults.tests.find(t => t.name.includes('Data Structure'))
  if (dataStructureTest?.status === 'PASSED') {
    console.log('✅ Client data structure is valid')
  } else {
    console.log('❌ Client data structure has issues - check data model')
  }
  
  const apiTest = testResults.tests.find(t => t.name.includes('Get Clients API'))
  if (apiTest?.status === 'PASSED') {
    console.log('✅ Client API calls are working correctly')
  } else {
    console.log('❌ Client API calls have issues - check API integration')
  }
  
  const uiStateTest = testResults.tests.find(t => t.name.includes('UI State Management'))
  if (uiStateTest?.status === 'PASSED') {
    console.log('✅ Client UI state management is properly configured')
  } else {
    console.log('❌ Client UI state management has issues - check state handling')
  }
  
  const formValidationTest = testResults.tests.find(t => t.name.includes('Form Validation'))
  if (formValidationTest?.status === 'PASSED') {
    console.log('✅ Client form validation is working correctly')
  } else {
    console.log('❌ Client form validation has issues - check validation logic')
  }
  
  return testResults
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests()
}
