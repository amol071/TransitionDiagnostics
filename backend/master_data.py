"""
Master data for Transition Diagnostics / LDC.

Representative Godrej-group style master lists for Companies, Functions,
Business Units, and Levels. These seed the `master_companies`,
`master_functions`, `master_business_units` and `master_levels`
collections on backend startup.
"""
from typing import List, Dict


# --- Companies ---
COMPANIES: List[Dict] = [
    {"code": "GCPL", "name": "Godrej Consumer Products Ltd.", "short_name": "GCPL"},
    {"code": "GPL", "name": "Godrej Properties Ltd.", "short_name": "GPL"},
    {"code": "GAVL", "name": "Godrej Agrovet Ltd.", "short_name": "GAVL"},
    {"code": "GIL", "name": "Godrej Industries Ltd.", "short_name": "GIL"},
    {"code": "G&B", "name": "Godrej & Boyce", "short_name": "G&B"},
    {"code": "GCAP", "name": "Godrej Capital", "short_name": "GCap"},
    {"code": "GHF", "name": "Godrej Housing Finance", "short_name": "GHF"},
    {"code": "GFL", "name": "Godrej Finance Ltd.", "short_name": "GFL"},
]


# --- Functions ---
FUNCTIONS: List[Dict] = [
    {"code": "HR", "name": "Human Resources"},
    {"code": "FIN", "name": "Finance"},
    {"code": "IT", "name": "Information Technology"},
    {"code": "ENG", "name": "Engineering"},
    {"code": "MKT", "name": "Marketing"},
    {"code": "SLS", "name": "Sales"},
    {"code": "SC", "name": "Supply Chain"},
    {"code": "OPS", "name": "Operations"},
    {"code": "STR", "name": "Strategy"},
    {"code": "LGL", "name": "Legal & Compliance"},
    {"code": "RND", "name": "R&D / Innovation"},
    {"code": "PRD", "name": "Product Management"},
    {"code": "DSG", "name": "Design"},
    {"code": "DAT", "name": "Data & Analytics"},
    {"code": "CRD", "name": "Credit"},
    {"code": "RSK", "name": "Risk"},
    {"code": "CSX", "name": "Customer Experience"},
    {"code": "CSE", "name": "Corporate Strategy & Execution"},
    {"code": "PMO", "name": "PMO"},
    {"code": "CMN", "name": "Communications"},
]


# --- Business Units ---
# company_code references one of the COMPANIES entries above.
BUSINESS_UNITS: List[Dict] = [
    # GCPL
    {"code": "GCPL-HC", "name": "Home Care", "company_code": "GCPL"},
    {"code": "GCPL-PC", "name": "Personal Care", "company_code": "GCPL"},
    {"code": "GCPL-HL", "name": "Hair Colour", "company_code": "GCPL"},
    {"code": "GCPL-INTL", "name": "International (Africa/USA/LatAm)", "company_code": "GCPL"},
    # GPL
    {"code": "GPL-RES", "name": "Residential", "company_code": "GPL"},
    {"code": "GPL-COM", "name": "Commercial", "company_code": "GPL"},
    {"code": "GPL-TWNS", "name": "Townships", "company_code": "GPL"},
    # GAVL
    {"code": "GAVL-ANF", "name": "Animal Feed", "company_code": "GAVL"},
    {"code": "GAVL-CPR", "name": "Crop Protection", "company_code": "GAVL"},
    {"code": "GAVL-DBY", "name": "Dairy", "company_code": "GAVL"},
    {"code": "GAVL-VPF", "name": "Vegetable Oils & Poultry", "company_code": "GAVL"},
    # GIL
    {"code": "GIL-CHM", "name": "Chemicals", "company_code": "GIL"},
    {"code": "GIL-VLP", "name": "Vegoils & Processed Foods", "company_code": "GIL"},
    # G&B
    {"code": "GNB-APP", "name": "Appliances", "company_code": "G&B"},
    {"code": "GNB-INT", "name": "Interio", "company_code": "G&B"},
    {"code": "GNB-LCK", "name": "Locks & Security", "company_code": "G&B"},
    {"code": "GNB-AER", "name": "Aerospace", "company_code": "G&B"},
    {"code": "GNB-PWR", "name": "Power Tools", "company_code": "G&B"},
    {"code": "GNB-CNS", "name": "Construction", "company_code": "G&B"},
    {"code": "GNB-MTE", "name": "Material Handling", "company_code": "G&B"},
    # GCap / GHF / GFL
    {"code": "GCAP-HL", "name": "Home Loans", "company_code": "GCAP"},
    {"code": "GCAP-LAP", "name": "Loan Against Property", "company_code": "GCAP"},
    {"code": "GCAP-BIZ", "name": "Business Loans", "company_code": "GCAP"},
    {"code": "GHF-HL", "name": "Home Loans", "company_code": "GHF"},
    {"code": "GFL-CORP", "name": "Corporate Finance", "company_code": "GFL"},
]


# --- Levels ---
# Band is the Godrej grade band; `ldc_level` maps to the LDC framework level (1..4)
LEVELS: List[Dict] = [
    {"code": "E1", "name": "Associate", "band": "E1", "ldc_level": 1, "order": 1},
    {"code": "E2", "name": "Senior Associate", "band": "E2", "ldc_level": 1, "order": 2},
    {"code": "M1", "name": "Manager", "band": "M1", "ldc_level": 2, "order": 3},
    {"code": "M2", "name": "Senior Manager", "band": "M2", "ldc_level": 2, "order": 4},
    {"code": "M3", "name": "Associate General Manager", "band": "M3", "ldc_level": 3, "order": 5},
    {"code": "M4", "name": "General Manager", "band": "M4", "ldc_level": 3, "order": 6},
    {"code": "E5", "name": "Vice President", "band": "E5", "ldc_level": 4, "order": 7},
    {"code": "E6", "name": "Senior Vice President", "band": "E6", "ldc_level": 4, "order": 8},
    {"code": "E7", "name": "Executive Vice President", "band": "E7", "ldc_level": 4, "order": 9},
]
