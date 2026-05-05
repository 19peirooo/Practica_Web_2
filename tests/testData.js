export const userData = {
  email: "test@test.com",
  password: "12345678"
};

export const adminData = {
  email: "admin@test.com",
  password: "12345678"
};

export const guestData = {
  email: "guest@test.com",
  password: "12345678"
};

export const userOnboardingData = {
  name: "Test",
  lastName: "User",
  nif: "12345678A",
  address: {
    street: "Travesia de Antonio Nebrija",
    number: 4,
    postal: "28040",
    city:"Madrid",
    province: "Madrid"
  }
}

export const companyOnboardingData = {
  isFreelance: false,
  name: "FAKECOMPANY",
  cif: "B-12345778",
  address: {
    street: "Gran Via",
    number: 15,
    postal: "28013",
    city: "Madrid",
    province: "Madrid"
  }
}

export const invalidUserData = {
  email: "test@test.com",
  password: "1234567"
};

export const clientData = {
    "name": "testClient",
    "cif":"A-23456789",
    "email":"testClient@mail.com",
    "address": {
        "street":"y",
        "number": 1,
        "postal": "00000",
        "city": "x",
        "province": "x"
    },
    "phone": "123456789"
}

export const clientData2 = {
    "name": "paco",
    "cif":"A-23456889",
    "email":"testClient1@mail.com",
    "address": {
        "street":"y",
        "number": 1,
        "postal": "00000",
        "city": "x",
        "province": "x"
    },
    "phone": "987654321"
}

export const projectData = {
    "name": "proyecto1",
    "projectCode": "PR-1",
    "email":"pr1@mail.com",
    "address": {
        "street":"Avenida Ancha de Castelar",
        "number": 53,
        "postal": "03690",
        "city": "Sant Vicent del Raspeig",
        "province": "Alicante"
    },
    "active": true
}

export const projectData2 = {
    "name": "proyecto2",
    "projectCode": "PR-2",
    "email":"pr2@mail.com",
    "address": {
        "street":"Avenida Ancha de Castelar",
        "number": 53,
        "postal": "03690",
        "city": "Sant Vicent del Raspeig",
        "province": "Alicante"
    },
    "active": false
}

export const deliveryNoteData = {
    "format": "material",
    "description": "Albaran de Materiales 1",
    "workDate": "2025-03-29",
    "material": "Cobre",
    "quantity": 10,
    "unit": "kg"
}

export const deliveryNoteData2 = {
    "format": "hours",
    "description": "Albaran de Horas 1",
    "workDate": "2026-04-26",
    "hours": 20,
    "workers": [
        {
            "name": "Manolo",
            "hours": 10
        },
        {
            "name": "Pepe",
            "hours": 10
        }
    ]
}

export const invalidDeliveryNoteData = {
    "format": "hours",
    "description": "Albaran de Horas 2",
    "workDate": "2026-04-26",
    "hours": 20,
    "workers": [
        {
            "name": "Manolo",
            "hours": 5
        },
        {
            "name": "Pepe",
            "hours": 10
        }
    ]
}

