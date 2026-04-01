// Quick test to verify Person entity integration
import { Person } from './entities/Person.js';

async function testPersonAPI() {
  console.log('Testing Person entity API integration...');

  try {
    // This will fail without proper authentication, but will test the structure
    console.log('Person class loaded successfully');
    console.log('Person methods:', Object.getOwnPropertyNames(Person));
    console.log('Person static methods available:', typeof Person.filter, typeof Person.create);

    // Test constructor
    const testPerson = new Person({ name: 'Test', type: 'cliente' });
    console.log('Person instance created:', testPerson.name);

    console.log('✅ Person entity structure is correct!');
  } catch (error) {
    console.error('❌ Error testing Person entity:', error);
  }
}

testPersonAPI();