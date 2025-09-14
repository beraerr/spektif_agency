/**
 * API ENDPOINT TESTS - SPEKTIF AGENCY
 * Test file to verify database persistence and API functionality
 * 
 * Run with: node test-results/api-endpoint-tests.js
 */

const BASE_URL = 'https://europe-west4-spektif-agency-final-prod.cloudfunctions.net'

// Test configuration
const TEST_CONFIG = {
  organizationId: 'spektif',
  userId: 'admin',
  testBoardTitle: `Test Board ${Date.now()}`,
  testListTitle: `Test List ${Date.now()}`,
  testCardTitle: `Test Card ${Date.now()}`
}

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    })
    
    const data = await response.json()
    return {
      success: response.ok,
      status: response.status,
      data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Test helper function
function runTest(testName, testFunction) {
  console.log(`\n🧪 Running test: ${testName}`)
  return testFunction()
    .then(result => {
      if (result.success) {
        console.log(`✅ PASSED: ${testName}`)
        testResults.passed++
        testResults.tests.push({ name: testName, status: 'PASSED', result })
      } else {
        console.log(`❌ FAILED: ${testName}`)
        console.log(`   Error: ${result.error || result.data?.error || 'Unknown error'}`)
        testResults.failed++
        testResults.tests.push({ name: testName, status: 'FAILED', result })
      }
    })
    .catch(error => {
      console.log(`❌ FAILED: ${testName} - Exception: ${error.message}`)
      testResults.failed++
      testResults.tests.push({ name: testName, status: 'FAILED', error: error.message })
    })
}

// Test 1: Health Check
async function testHealthCheck() {
  const result = await makeRequest('/health')
  return {
    success: result.success && result.data?.status === 'ok',
    data: result.data
  }
}

// Test 2: Login
async function testLogin() {
  const result = await makeRequest('/login', 'POST', {
    email: 'admin@spektif.com',
    password: 'admin123'
  })
  return {
    success: result.success && result.data?.token,
    data: result.data
  }
}

// Test 3: Get Organizations
async function testGetOrganizations() {
  const result = await makeRequest(`/getOrganizations?userId=${TEST_CONFIG.userId}`)
  return {
    success: result.success && Array.isArray(result.data),
    data: result.data
  }
}

// Test 4: Create Board
async function testCreateBoard() {
  const result = await makeRequest('/createBoard', 'POST', {
    title: TEST_CONFIG.testBoardTitle,
    description: 'Test board for API testing',
    organizationId: TEST_CONFIG.organizationId,
    userId: TEST_CONFIG.userId
  })
  
  if (result.success && result.data?.id) {
    TEST_CONFIG.createdBoardId = result.data.id
  }
  
  return {
    success: result.success && result.data?.id,
    data: result.data
  }
}

// Test 5: Get Board (Verify Creation)
async function testGetBoard() {
  if (!TEST_CONFIG.createdBoardId) {
    return { success: false, error: 'No board ID available' }
  }
  
  const result = await makeRequest(`/getBoard?boardId=${TEST_CONFIG.createdBoardId}`)
  return {
    success: result.success && result.data?.id === TEST_CONFIG.createdBoardId,
    data: result.data
  }
}

// Test 6: Create List
async function testCreateList() {
  if (!TEST_CONFIG.createdBoardId) {
    return { success: false, error: 'No board ID available' }
  }
  
  const result = await makeRequest('/createList', 'POST', {
    boardId: TEST_CONFIG.createdBoardId,
    title: TEST_CONFIG.testListTitle,
    position: 0
  })
  
  if (result.success && result.data?.id) {
    TEST_CONFIG.createdListId = result.data.id
  }
  
  return {
    success: result.success && result.data?.id,
    data: result.data
  }
}

// Test 7: Create Card
async function testCreateCard() {
  if (!TEST_CONFIG.createdBoardId || !TEST_CONFIG.createdListId) {
    return { success: false, error: 'No board or list ID available' }
  }
  
  const result = await makeRequest('/createCard', 'POST', {
    boardId: TEST_CONFIG.createdBoardId,
    listId: TEST_CONFIG.createdListId,
    title: TEST_CONFIG.testCardTitle,
    description: 'Test card description',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    position: 0
  })
  
  if (result.success && result.data?.id) {
    TEST_CONFIG.createdCardId = result.data.id
  }
  
  return {
    success: result.success && result.data?.id,
    data: result.data
  }
}

// Test 8: Get Cards
async function testGetCards() {
  if (!TEST_CONFIG.createdBoardId) {
    return { success: false, error: 'No board ID available' }
  }
  
  const result = await makeRequest(`/getCards?boardId=${TEST_CONFIG.createdBoardId}`)
  return {
    success: result.success && Array.isArray(result.data),
    data: result.data
  }
}

// Test 9: Get Employees
async function testGetEmployees() {
  const result = await makeRequest(`/getEmployees?organizationId=${TEST_CONFIG.organizationId}`)
  return {
    success: result.success && Array.isArray(result.data),
    data: result.data
  }
}

// Test 10: Get Clients
async function testGetClients() {
  const result = await makeRequest(`/getClients?organizationId=${TEST_CONFIG.organizationId}`)
  return {
    success: result.success && Array.isArray(result.data),
    data: result.data
  }
}

// Test 11: Update Card
async function testUpdateCard() {
  if (!TEST_CONFIG.createdBoardId || !TEST_CONFIG.createdCardId) {
    return { success: false, error: 'No board or card ID available' }
  }
  
  const result = await makeRequest(`/updateCard?boardId=${TEST_CONFIG.createdBoardId}&cardId=${TEST_CONFIG.createdCardId}`, 'PUT', {
    title: `${TEST_CONFIG.testCardTitle} - UPDATED`,
    description: 'Updated test card description'
  })
  
  return {
    success: result.success,
    data: result.data
  }
}

// Test 12: Database Persistence (Refresh Test)
async function testDatabasePersistence() {
  if (!TEST_CONFIG.createdBoardId) {
    return { success: false, error: 'No board ID available' }
  }
  
  // Wait a moment to ensure data is persisted
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const result = await makeRequest(`/getBoard?boardId=${TEST_CONFIG.createdBoardId}`)
  const hasLists = result.data?.lists && result.data.lists.length > 0
  const hasCards = result.data?.lists?.[0]?.cards && result.data.lists[0].cards.length > 0
  
  return {
    success: result.success && hasLists && hasCards,
    data: {
      boardExists: result.success,
      hasLists,
      hasCards,
      boardData: result.data
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Endpoint Tests for Spektif Agency')
  console.log('=' .repeat(60))
  
  // Run tests in sequence
  await runTest('Health Check', testHealthCheck)
  await runTest('Login', testLogin)
  await runTest('Get Organizations', testGetOrganizations)
  await runTest('Create Board', testCreateBoard)
  await runTest('Get Board (Verify Creation)', testGetBoard)
  await runTest('Create List', testCreateList)
  await runTest('Create Card', testCreateCard)
  await runTest('Get Cards', testGetCards)
  await runTest('Get Employees', testGetEmployees)
  await runTest('Get Clients', testGetClients)
  await runTest('Update Card', testUpdateCard)
  await runTest('Database Persistence', testDatabasePersistence)
  
  // Print summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
  
  console.log('\n📋 DETAILED RESULTS:')
  testResults.tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌'
    console.log(`${status} ${test.name}`)
    if (test.status === 'FAILED' && test.error) {
      console.log(`   Error: ${test.error}`)
    }
  })
  
  // Critical issues check
  console.log('\n🚨 CRITICAL ISSUES CHECK:')
  const criticalTests = ['Create Board', 'Get Board (Verify Creation)', 'Database Persistence']
  const criticalFailures = testResults.tests.filter(test => 
    criticalTests.includes(test.name) && test.status === 'FAILED'
  )
  
  if (criticalFailures.length > 0) {
    console.log('❌ CRITICAL ISSUES FOUND:')
    criticalFailures.forEach(test => {
      console.log(`   - ${test.name}: Database persistence may be broken`)
    })
  } else {
    console.log('✅ No critical issues found - Database persistence appears to be working')
  }
  
  return testResults
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error)
}
