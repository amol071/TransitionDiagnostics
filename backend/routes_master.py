"""Master data routes: Companies, Functions, Business Units, Levels."""
from fastapi import APIRouter, Depends
from core import db, get_current_user


router = APIRouter(tags=["master"])


@router.get("/master/companies")
async def list_companies(user=Depends(get_current_user)):
    return await db.master_companies.find({}, {"_id": 0}).sort("name", 1).to_list(500)


@router.get("/master/functions")
async def list_functions(user=Depends(get_current_user)):
    return await db.master_functions.find({}, {"_id": 0}).sort("name", 1).to_list(500)


@router.get("/master/business-units")
async def list_business_units(user=Depends(get_current_user)):
    return await db.master_business_units.find({}, {"_id": 0}).sort("name", 1).to_list(500)


@router.get("/master/levels")
async def list_levels(user=Depends(get_current_user)):
    return await db.master_levels.find({}, {"_id": 0}).sort("order", 1).to_list(500)


@router.get("/master/all")
async def list_all_master(user=Depends(get_current_user)):
    companies = await db.master_companies.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    functions = await db.master_functions.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    bus = await db.master_business_units.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    levels = await db.master_levels.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return {
        "companies": companies,
        "functions": functions,
        "business_units": bus,
        "levels": levels,
    }
