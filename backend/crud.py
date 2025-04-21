from fastapi import APIRouter, Depends
from auth import verify_token

router = APIRouter()

@router.get("/vendas", dependencies=[Depends(verify_token)])
def get_vendas():
    return {
        "meses": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
        "valores": [10, 15, 8, 20, 25, 18]
    }
