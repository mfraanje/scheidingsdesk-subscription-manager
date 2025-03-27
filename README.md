# Client Subscription Validator (Azure Function)

Deze Azure Function is ontwikkeld om clientgegevens uit Microsoft Dataverse te halen op basis van een clientID. Het valideert of een specifieke client bestaat in het systeem en haalt bijbehorende abonnementsgegevens op.

## Functionaliteit

De functie:
1. Ontvangt een clientID via een HTTP POST request
2. Maakt verbinding met Dataverse (Microsoft's data platform)
3. Zoekt naar de client in de opgegeven entiteit (standaard: contacts)
4. Retourneert de gevonden clientgegevens of een foutmelding

## Vereisten

- Een Azure account met toegang tot Azure Functions
- Een Microsoft Dataverse / Dynamics 365 omgeving
- De juiste toegangsgegevens (tenant ID, application ID, client secret)

## Installatie

1. Maak een nieuwe Azure Function in het Azure portal of via de Azure CLI
2. Upload of kopieer de code naar je Azure Function project
3. Configureer de benodigde omgevingsvariabelen (zie hieronder)
4. Deploy de functie naar Azure

## Omgevingsvariabelen instellen

De volgende omgevingsvariabelen moeten worden ingesteld in de Azure Function configuratie:

| Variabele | Beschrijving | Voorbeeld |
|-----------|-------------|-----------|
| TENANT_ID | De Microsoft 365 tenant ID | `12345678-1234-1234-1234-123456789012` |
| APPLICATION_ID | De ID van de geregistreerde Azure AD applicatie | `87654321-4321-4321-4321-210987654321` |
| CLIENT_SECRET | Het client secret van de Azure AD applicatie | `your-client-secret-here` |
| DATAVERSE_URL | De URL van je Dataverse/Dynamics 365 omgeving | `https://jouworganisatie.crm.dynamics.com` |
| ENTITY_NAME | (Optioneel) De naam van de entiteit/tabel in Dataverse | `contacts` (standaard) |
| CLIENT_ID_FIELD | (Optioneel) Het veld dat de client ID bevat | `contactid` (standaard) |
| SUBSCRIPTION_FIELD | (Optioneel) Het veld dat de abonnementsgegevens bevat | `subscriptionid` (standaard) |

Je kunt deze configureren in het Azure Portal:
1. Ga naar je Function App
2. Klik op "Configuration" in het linkermenu
3. Voeg elke variabele toe via "New application setting"

## Gebruik

De functie kan worden aangeroepen via een HTTP POST request naar het endpoint:

```
POST https://jouw-function-app.azurewebsites.net/api/subscription/validator
```

Met de volgende JSON in de body:

```json
{
  "clientId": "client-id-hier"
}
```

### Succesvolle respons (status 200)

```json
{
  "contactid": "client-id-hier",
  "subscription_field": "abonnementsgegevens",
  ...andere velden...
}
```

### Foutresponses

- **400 Bad Request**: Wanneer geen clientId is opgegeven
```json
{
  "error": "Please provide a clientId in the request body"
}
```

- **404 Not Found**: Wanneer de client niet gevonden is
```json
{
  "error": "Client with ID client-id-hier not found"
}
```

- **500 Internal Server Error**: Bij onverwachte fouten
```json
{
  "error": "An error occurred while retrieving client data",
  "details": "Foutmelding details"
}
```

## Ontwikkelaarsnotities

### Code Overzicht

De functie bestaat uit twee belangrijke onderdelen:
1. `validateSubscription` - De hoofdfunctie die HTTP requests afhandelt
2. `getClientDataFromDataverse` - Voert de feitelijke query uit naar Dataverse

### Verbinding met Dataverse

De verbinding met Dataverse wordt gemaakt via:
1. Azure Identity `ClientSecretCredential` voor authenticatie
2. De `dynamics-web-api` bibliotheek voor het uitvoeren van queries

### Lokaal testen

Om de functie lokaal te testen:
1. Installeer Azure Functions Core Tools
2. Maak een `local.settings.json` bestand met de vereiste omgevingsvariabelen
3. Voer `func start` uit in je terminal

Voorbeeld van `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "TENANT_ID": "jouw-tenant-id",
    "APPLICATION_ID": "jouw-app-id",
    "CLIENT_SECRET": "jouw-client-secret",
    "DATAVERSE_URL": "https://jouworganisatie.crm.dynamics.com",
    "ENTITY_NAME": "contacts",
    "CLIENT_ID_FIELD": "contactid",
    "SUBSCRIPTION_FIELD": "subscriptionid"
  }
}
```

## Veiligheidsoverwegingen

- De functie gebruikt momenteel `authLevel: 'anonymous'`, wat betekent dat er geen authenticatie nodig is om de functie aan te roepen
- In een productieomgeving zou je kunnen overwegen om dit te veranderen naar `function` of `admin`
- Bewaar nooit gevoelige gegevens zoals client secrets in de code - gebruik altijd omgevingsvariabelen of Azure KeyVault

## Problemen oplossen

Als je problemen ondervindt:
1. Controleer of alle omgevingsvariabelen correct zijn ingesteld
2. Kijk in de Azure Function logs voor foutmeldingen
3. Controleer of de service principal voldoende rechten heeft op Dataverse
4. Zorg ervoor dat het DATAVERSE_URL format correct is