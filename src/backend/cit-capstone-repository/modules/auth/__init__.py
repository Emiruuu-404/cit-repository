

from fastapi import FastAPI
from modules.auth.api_current_user import register_api_current_user_route
from modules.auth.api_login import register_api_login_route
from modules.auth.api_logout import register_api_logout_route
from modules.auth.login import register_login_route
from modules.auth.logout import register_logout_route

def configure_auth_module(app: FastAPI):
    register_login_route(app)
    register_logout_route(app)
    register_api_login_route(app)
    register_api_logout_route(app)
    register_api_current_user_route(app)