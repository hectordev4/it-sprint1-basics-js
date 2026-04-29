// this is the object we'll be mucking around with and proxying 
const getCharacter = () => {
  return {
    _id: '9RKDLS02580GHCXNZLA0',
    password: 'isolemnlysweariamuptonogood',
    name: {first: 'Ron', last: 'Weasly'},
    classes: [
      {name: 'Divination', teacher: 'Sybill Trelawney'},
      {name: 'Defence Against the Dark Arts', teacher: 'Dolores Umbridge'},
    ],
    greet(greeting = 'Hi') {
      const {first, last} = this.name
      return `${greeting}! My name is ${first} ${last} and my ID is ${this._id} and my password is ${this.password}!`
    },
    getTeachers() {
      return this.classes.map(({teacher}) => teacher)
    },
  }
}

const handler = {};

test('22_proxies-1: can wrap an existing object', () => {
  const character = getCharacter()
  const proxy = new Proxy(character,handler)
  // Comprova que el proxy no és igual referencialment però sí igual profundament a l'objecte original
  expect(proxy).not.toBe(character) // referencialment diferent
  expect(proxy).toEqual(character) // profundament igual
})

test('22_proxies-2: handler can intercept gets, sets, and deletes', () => {
  const character = getCharacter()

  const handler = {
    // GET: Using a loop for path resolution
    get(target, prop) {
      const path = prop.split('.');
      let result = target;

      for (const key of path) {
        // Use Reflect.get to safely access the property
        result = Reflect.get(result || {}, key);
      }
      return result;
    },

    // SET: Navigating to the depth and assigning
    set(target, prop, value) {
      const path = prop.split('.');
      let current = target;

      // Navigate to the second-to-last object
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) current[key] = {};
        current = current[key];
      }

      // Use Reflect.set for the final assignment
      return Reflect.set(current, path[path.length - 1], value);
    },

    // DELETE: Logic for protected vs non-protected properties
    deleteProperty(target, prop) {
      // If it starts with _, we "fake" a success without deleting
      if (prop.startsWith('_' || '#')) {
        return true; 
      }
      // Otherwise, use Reflect to perform the standard deletion
      return Reflect.deleteProperty(target, prop);
    }
  };

  const proxy = new Proxy(character, handler)

  // Interactua amb el proxy
  proxy['classes.1.teacher'] = 'Severus Snape' // assignació profunda
  proxy.awesome = 10 // assignació superficial
  delete proxy._id // elimina una propietat "protegida"

  // Fes algunes comprovacions
  expect(proxy['classes.1.teacher']).toBe('Severus Snape') // obtenció profunda
  expect(proxy.awesome).toBe(10) // obtenció superficial
  expect(proxy._id).toEqual('9RKDLS02580GHCXNZLA0') // propietat no eliminada

  // Neteja
  delete proxy.awesome // elimina una propietat no protegida
  expect(proxy.awesome).toBe(undefined) // propietat eliminada correctament
})

//////// EXTRA CREDIT ////////

test.skip('22_proxies-3: can intercept function calls', () => {
  const character = getCharacter()

  const handler = {}
  // Tingues en compte que `apply` només funciona per a proxies en funcions!
  character.greet = new Proxy(character.greet, handler)
  character.getTeachers = new Proxy(character.getTeachers, handler)
  const result = character.greet('Hey there')
  // Comprova que el resultat no conté informació sensible
  expect(result).not.toContain(character.password)
  expect(result).not.toContain(character._id)
  expect(character.getTeachers()).toEqual([
    'Sybill Trelawney',
    'Dolores Umbridge',
  ])
})

test.skip('22_proxies-4: can be used to do some fancy stuff with arrays', () => {
  const characters = [
    'Harry Potter',
    'Ron Weasly',
    'Hermione Granger',
    'Nevel Longbottom',
    'Lavender Brown',
    'Scabbers',
    'Pigwidgeon',
  ]

  const handler = {}
  const proxy = new Proxy(characters, handler)
  // Comprova que el proxy permet accedir a elements de l'array amb índexs positius i negatius
  expect(proxy[0]).toBe('Harry Potter')
  expect(proxy[-1]).toBe('Pigwidgeon')
  expect(proxy[-4]).toBe('Nevel Longbottom')
})

