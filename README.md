# HELA – namų išlaidų analizės ir prognozavimo sistema

**HELA** - universiteto programų sistemų projektavimo kursinio darbo prototipas. Sistema leidžia registruoti, peržiūrėti, redaguoti ir ištrinti namų ūkio išlaidas, analizuoti jų pasiskirstymą pagal kategorijas, aptikti neįprastai didelių išlaidų mėnesius ir prognozuoti kito mėnesio išlaidas.

Projektą sudaro **HTML + CSS + JavaScript** naudotojo sąsaja, **Python + FastAPI** REST API, atskiras išlaidų analizės modulis ir **SQLite** duomenų bazė. Automatiniams testams naudojamas Python **unittest**.

## Pagrindinis principas - klientų duomenų atskyrimas

Duomenų bazėje automatiškai sukuriami du demonstraciniai klientai: **Šeima A** (`client_id = 1`) ir **Šeima B** (`client_id = 2`).

- Kiekvienas išlaidų įrašas turi `client_id`.
- Išlaidų peržiūra, redagavimas ir trynimas duomenų bazės užklausose ribojami pagal kliento identifikatorių.
- Analizė, anomalijos ir prognozė skaičiuojamos pagal pasirinkto kliento išlaidas.
- Dabartinė internetinė sąsaja naudoja fiksuotą `client_id = 1` (Šeima A).

**Apribojimas:** tai duomenų atskyrimas pagal identifikatorių, o ne autentifikacija. API neturi prisijungimo, slaptažodžių ar prieigos teisių patikros, todėl vien `client_id` neapsaugo kito kliento duomenų. Sistema skirta vietiniam mokomajam demonstravimui.

## Pagrindinės funkcijos ir verslo taisyklės

1. **Išlaidų registravimas.** Įvedama suma, kategorija, data ir neprivalomas aprašymas. Suma turi būti didesnė už nulį.
2. **Išlaidų peržiūra.** Pateikiamas konkretaus kliento išlaidų sąrašas.
3. **Redagavimas ir trynimas.** Galima keisti arba pašalinti konkretaus kliento išlaidą. Nerastas įrašas grąžina `404`.
4. **Išlaidų analizė.** Skaičiuojama bendra išlaidų suma (`total`), sumos pagal kategorijas (`by_category`) ir didžiausia išlaidų kategorija (`top_category`).
5. **Anomalijų aptikimas.** Išlaidos grupuojamos pagal mėnesius. Mėnuo laikomas neįprastu, jeigu jo išlaidų suma daugiau kaip **2 kartus viršija ankstesnių mėnesių vidurkį**.
6. **Išlaidų prognozavimas.** Kito mėnesio išlaidos prognozuojamos pagal **paskutinių trijų mėnesių išlaidų vidurkį**. Jeigu duomenų nepakanka, sistema pateikia informacinį pranešimą.

### Verslo taisyklės

| Sąlyga | Sistemos veiksmas |
|---|---|
| Išlaidų suma mažesnė arba lygi 0 | Išlaida atmetama |
| Neegzistuojantis išlaidų įrašas | Grąžinama `404 Not Found` |
| Mažiau nei 3 mėnesių duomenys | Prognozė neskaičiuojama |
| Mėnesio išlaidos viršija ankstesnį vidurkį daugiau nei 2 kartus | Fiksuojama anomalija |
| Bent 3 mėnesių duomenys | Apskaičiuojama kito mėnesio prognozė |

**Pastaba:** pirminiame projektavimo dokumente buvo numatytas anomalijų slenkstis `1,4 ×` ir prognozė `vidurkis × 1,05`. Dabartiniame `backend/analysis.py` kode naudojamas `2 ×` anomalijų slenkstis ir trijų mėnesių vidurkis be papildomo koeficiento.

## Reikalingi įrankiai

- Python su `venv` ir `pip`.
- FastAPI – REST API kūrimui.
- Uvicorn – serverio paleidimui.
- SQLite – duomenų saugojimui.
- Interneto naršyklė – vartotojo sąsajai.
- PyCharm arba kita programavimo aplinka.

**React ir Node.js nereikalingi**, nes vartotojo sąsaja sukurta naudojant HTML, CSS ir JavaScript.

Dabartiniame kode nėra OpenAI API integracijos. Išlaidų analizė ir prognozavimas atliekami Python funkcijomis.

## Paruošimas (vieną kartą)

### 1. Atsisiųskite projektą

```powershell
git clone https://github.com/Klemensas220/HELA.git
cd HELA
```

### 2. Sukurkite virtualią aplinką

```powershell
python -m venv .venv
```

### 3. Įdiekite reikalingas bibliotekas

```powershell
.\.venv\Scripts\python.exe -m pip install fastapi uvicorn
```

Duomenų bazė `backend/hela.db` sukuriama automatiškai pirmą kartą paleidžiant programą.

## Sistemos paleidimas

Projekto pagrindiniame kataloge paleiskite:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Atidarykite:

- **HELA svetainė:** http://127.0.0.1:8000/app
- **API dokumentacija:** http://127.0.0.1:8000/docs
- **API pradinis adresas:** http://127.0.0.1:8000/

Serveris sustabdomas terminale paspaudus `Ctrl + C`.

## Sistemos demonstravimas

1. Paleiskite FastAPI serverį ir atidarykite HELA svetainę.
2. Pridėkite naują išlaidą, pavyzdžiui, **Maistas - 15 €**.
3. Patikrinkite, ar išlaida atsirado sąraše ir atsinaujino bendra išlaidų suma.
4. Redaguokite išlaidą, pakeisdami jos sumą į **20 €**.
5. Pridėkite išlaidų bent trims skirtingiems mėnesiams.
6. Peržiūrėkite kito mėnesio išlaidų prognozę.
7. Įveskite neįprastai dideles trečio mėnesio išlaidas ir patikrinkite anomalijų aptikimą.
8. Ištrinkite pasirinktą išlaidą ir patikrinkite, ar atsinaujino analizė.
9. Paleiskite automatinius testus.

## Duomenų bazė

Sistema naudoja **SQLite** duomenų bazę, saugomą `backend/hela.db` faile.

### Lentelės

| Lentelė | Laukai | Paskirtis |
|---|---|---|
| `clients` | `id`, `name` | Klientų informacija |
| `expenses` | `id`, `client_id`, `amount`, `category`, `description`, `spent_on` | Išlaidų informacija |

### Demonstraciniai klientai

| Kliento ID | Pavadinimas |
|---|---|
| 1 | Šeima A |
| 2 | Šeima B |

Pradinės išlaidos automatiškai nesukuriamos. Jos registruojamos naudojant vartotojo sąsają arba REST API.

Visi įrašai išlieka tarp programos paleidimų.

## API metodai

| Metodas | Adresas | Paskirtis |
|---|---|---|
| `GET` | `/` | Patikrinti sistemos veikimą |
| `POST` | `/expense` | Pridėti naują išlaidą |
| `GET` | `/expenses/{client_id}` | Gauti kliento išlaidas |
| `PUT` | `/expenses/{expense_id}` | Redaguoti išlaidą |
| `DELETE` | `/expenses/{expense_id}?client_id=1` | Ištrinti išlaidą |
| `GET` | `/analysis/{client_id}` | Gauti išlaidų analizę |
| `GET` | `/anomalies/{client_id}` | Aptikti anomalijas |
| `GET` | `/forecast/{client_id}` | Prognozuoti kito mėnesio išlaidas |

### Išlaidos pridėjimo pavyzdys

`POST /expense`

```json
{
  "client_id": 1,
  "amount": 15.50,
  "category": "Maistas",
  "description": "Pietūs",
  "spent_on": "2026-11-10T00:00:00"
}
```

API užklausas galima išbandyti per FastAPI Swagger dokumentaciją.

## Išlaidų analizė

Analizė atliekama `backend/analysis.py` faile.

Funkcija `analyze_expense()` apskaičiuoja:

- Bendrą išlaidų sumą.
- Išlaidų sumas pagal kategorijas.
- Kategoriją, kuriai išleista daugiausia pinigų.

Rezultatai pateikiami vartotojo sąsajoje.

## Anomalijų aptikimas

Funkcija `detect_anomalies()` analizuoja mėnesines išlaidas.

Jeigu mėnesio išlaidų suma viršija ankstesnių mėnesių vidurkį daugiau nei du kartus, sistema pažymi šį mėnesį kaip neįprastą.

Pavyzdys:

| Mėnuo | Išlaidos |
|---|---|
| Sausis | 100 € |
| Vasaris | 120 € |
| Kovas | 500 € |

Ankstesnių mėnesių vidurkis yra 110 €. Kovo mėnesio išlaidos viršija dvigubą vidurkį, todėl nustatoma anomalija.

## Išlaidų prognozavimas

Funkcija `forecast_expenses()` prognozuoja būsimas išlaidas pagal paskutinių trijų mėnesių vidurkį.

Pavyzdys:

| Mėnuo | Išlaidos |
|---|---|
| Sausis | 100 € |
| Vasaris | 120 € |
| Kovas | 500 € |

Prognozė:

```text
(100 + 120 + 500) / 3 = 240 €
```

**Kito mėnesio prognozuojamos išlaidos – 240 €.**

Jeigu duomenys pateikti tik už vieną arba du mėnesius, sistema grąžina pranešimą:

```text
Prognozei reikia bent 3 mėnesių duomenų
```

## Automatiniai testai

Projektui testuoti naudojama Python `unittest` biblioteka.

Testai saugomi `tests/test_hela.py` faile.

Paleidimas:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Tikrinami šie scenarijai:

1. Prognozės apskaičiavimas pagal trijų mėnesių duomenis.
2. Prognozavimo veikimas, kai duomenų nepakanka.
3. Neigiamų išlaidų atmetimas.
4. Skirtingų klientų duomenų atskyrimas.

Testų rezultatai pateikiami terminale.

## Projekto struktūra

```text
HELA/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── schemas.py
│   ├── analysis.py
│   └── hela.db
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── tests/
│   ├── __init__.py
│   └── test_hela.py
│
├── .gitignore
└── README.md
```

### Failų paskirtis

- `backend/main.py` – FastAPI maršrutai ir užklausų apdorojimas.
- `backend/database.py` – SQLite duomenų bazė ir CRUD operacijos.
- `backend/schemas.py` – duomenų validavimas naudojant Pydantic.
- `backend/analysis.py` – išlaidų analizė, anomalijų aptikimas ir prognozavimas.
- `backend/__init__.py` – Python paketo inicializavimo failas.
- `frontend/index.html` – vartotojo sąsajos struktūra.
- `frontend/style.css` – vartotojo sąsajos dizainas.
- `frontend/script.js` – vartotojo sąsajos funkcionalumas ir API užklausos.
- `tests/test_hela.py` – automatiniai testai.
- `.gitignore` – failai, kurie neįkeliami į GitHub.

## Duomenų bazės atkūrimas

**Dėmesio: šie veiksmai ištrina visas vietines išlaidas.**

Sustabdykite FastAPI serverį ir projekto pagrindiniame kataloge vykdykite:

```powershell
Remove-Item .\backend\hela.db
```

Tada iš naujo paleiskite sistemą:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Programa automatiškai sukurs SQLite lenteles ir du pradinius klientus.

## Dabartiniai apribojimai ir tolesni darbai

- Vartotojo sąsaja naudoja fiksuotą `client_id = 1`.
- Nėra vartotojų registracijos ir prisijungimo sistemos.
- Nėra banko sąskaitų integracijos.
- Prognozavimui naudojamas statistinis vidurkis, o ne išorinis AI modelis.
- Ateityje galima pridėti išlaidų filtravimą, išsamesnes diagramas ir automatinį išlaidų kategorizavimą.
- Galima įgyvendinti OpenAI API integraciją pažangesnei išlaidų analizei.

## Projekto tikslas

Sukurti veikiančią namų ūkio išlaidų registravimo, analizės ir prognozavimo sistemą, kurioje būtų atskirti vartotojo sąsajos, REST API, duomenų bazės ir verslo logikos sluoksniai.

Projektas skirtas pademonstruoti Python, FastAPI, SQLite ir internetinių technologijų panaudojimą kuriant programų sistemą.
