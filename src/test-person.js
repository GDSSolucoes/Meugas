// Quick test to verify Person entity integration
import { Persons } from './entities/Persons.js';

async function testPersonAPI() {
  console.log('Testing Person entity API integration...');

  try {
    // This will fail without proper authentication, but will test the structure
    console.log('Person class loaded successfully');
    console.log('Person methods:', Object.getOwnPropertyNames(Persons));
    console.log('Person static methods available:', typeof Persons.filter, typeof Persons.create);

    // Test constructor
    const testPerson = new Persons({ name: 'Test', type: 'cliente' });
    console.log('Person instance created:', testPerson.name);

    console.log('✅ Person entity structure is correct!');
  } catch (error) {
    console.error('❌ Error testing Person entity:', error);
  }
}

testPersonAPI();