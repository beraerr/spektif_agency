// Test script to simulate delete operations
// Run this in browser console or Node.js

const testDelete = async () => {
  const apiUrl = 'http://localhost:5001/spektif-agency-final-prod/europe-west4'
  
  // Test 1: Check if emulator is running
  console.log('=== Test 1: Health Check ===')
  try {
    const healthResponse = await fetch(`${apiUrl}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check passed:', healthData)
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    console.error('⚠️  Make sure Firebase emulators are running: npm run firebase:emulators')
    return
  }
  
  // Test 2: Delete Employee
  console.log('\n=== Test 2: Delete Employee ===')
  try {
    const deleteEmpResponse = await fetch(`${apiUrl}/deleteEmployee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: 'spektif',
        id: 'test-emp-id'
      })
    })
    
    console.log('Status:', deleteEmpResponse.status, deleteEmpResponse.statusText)
    const deleteEmpText = await deleteEmpResponse.text()
    console.log('Response:', deleteEmpText)
    
    if (deleteEmpResponse.ok) {
      console.log('✅ Delete employee endpoint is working')
    } else {
      console.log('⚠️  Delete employee endpoint returned error (expected if employee not found)')
    }
  } catch (error) {
    console.error('❌ Delete employee failed:', error.message)
    if (error.message.includes('Failed to fetch')) {
      console.error('   → This usually means:')
      console.error('     1. Firebase Functions emulator is not running')
      console.error('     2. Wrong URL or port')
      console.error('     3. CORS issue')
    }
  }
  
  // Test 3: Delete Client
  console.log('\n=== Test 3: Delete Client ===')
  try {
    const deleteClientResponse = await fetch(`${apiUrl}/deleteClient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: 'spektif',
        id: 'test-client-id'
      })
    })
    
    console.log('Status:', deleteClientResponse.status, deleteClientResponse.statusText)
    const deleteClientText = await deleteClientResponse.text()
    console.log('Response:', deleteClientText)
    
    if (deleteClientResponse.ok) {
      console.log('✅ Delete client endpoint is working')
    } else {
      console.log('⚠️  Delete client endpoint returned error (expected if client not found)')
    }
  } catch (error) {
    console.error('❌ Delete client failed:', error.message)
  }
  
  console.log('\n=== Test Complete ===')
}

// Run tests
testDelete().catch(console.error)

