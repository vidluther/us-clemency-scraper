# Clemency- Scraper

This is a scraper that scrapes the DOJ website and makes a local searchable DB of Pardons and Commutations provided by all U.S Presidents since 2000.

The official list of Clemency Recipients is available at:

https://www.justice.gov/pardon/clemency-recipients

## Local Setup


```
pnpm install
supabase start
pnpm scrape:all
```

## Fetching the data via postgREST

To get the data from the DB, you can call the *pardon_details* api endpoint



### Required headers:
apikey: {{SUPABASE_publishable_KEY}}
Authorization: Bearer {{SUPABASE_publishable_KEY}}
Accept-Profile: pardonned

###
Filter by one administration:
GET {{SUPABASE_URL}}/rest/v1/pardon_details?administration_slug=eq.obama-1
Other useful filters:

### By president name
GET {{SUPABASE_URL}}/rest/v1/pardon_details?president_name=eq.Barack H. Obama

### By clemency type
GET {{SUPABASE_URL}}/rest/v1/pardon_details?clemency_type=eq.pardon

### Combined: pardons for Obama term 1 only
GET {{SUPABASE_URL}}/rest/v1/pardon_details?administration_slug=eq.obama-1&clemency_type=eq.pardon

### Order by grant date descending
GET {{SUPABASE_URL}}/rest/v1/pardon_details?order=grant_date.desc&limit=20
Note: The Accept-Profile: pardonned header is critical — without it, PostgREST won't find the view in the custom pardonned schema.
