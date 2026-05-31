from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, Any
from sqlalchemy.sql import func
import datetime

from app.models.user import User, FacilityAdmin
from app.schemas.user import UserCreate, ManagerCreate

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        result = await self.db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Retrieve a user by their ID.
    
        :param user_id: The ID of the user to retrieve
        :type user_id: int
        :return: The User object if found, otherwise None
        :rtype: Optional[User]
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.
    
        :param email: The email address of the user to retrieve
        :type email: str
        :return: The User object if found, otherwise None
        :rtype: Optional[User]
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create(self, user_create: UserCreate, hashed_password: str) -> User:
        """
        Create a new user in the database.
    
        :param user_create: The UserCreate schema containing user information for creation
        :type user_create: UserCreate
        :param hashed_password: The hashed password to store for the user
        :type hashed_password: str
        :return: The newly created User object
        :rtype: User
        """
        new_user = User(
            email=user_create.email,
            fullname=user_create.fullname,
            idnum=user_create.idnum,
            hashed_password=hashed_password,
            role=user_create.role.value if user_create.role else None,  # Convert enum to string
            is_active=user_create.is_active,
            created_at=datetime.datetime.now()
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user
    
    async def update_last_login(self, user_id: int) -> None:
        """
        Update the last login timestamp for a user.
    
        :param user_id: The ID of the user to update
        :type user_id: int
        """
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = func.now()
            await self.db.commit()

    async def refresh(self, user_id: int) -> Optional[User]:
        """
        Refresh the user instance from the database to get the latest data.
    
        :param user_id: The ID of the user to refresh
        :type user_id: int
        :return: The refreshed User object if found, otherwise None
        :rtype: Optional[User]
        """
        user = await self.get_by_id(user_id)
        if user:
            await self.db.refresh(user)
            return user
        return None

    async def update(self, user_id: int, **kwargs: Any) -> Optional[User]:
        """
        Update user information based on provided keyword arguments.
    
        :param user_id: The ID of the user to update
        :type user_id: int
        :param kwargs: Key-value pairs of fields to update (e.g., fullname, email, role)
        :type kwargs: dict
        :return: The updated User object if the user exists, otherwise None
        :rtype: Optional[User]
        """
        user = await self.get_by_id(user_id)
        if not user:
            return None
        for key, value in kwargs.items():
            setattr(user, key, value)
        user.updated_at = datetime.datetime.now()
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def delete(self, user_id: int) -> bool:
        """
        Delete a user from the database.
    
        :param user_id: The ID of the user to delete
        :type user_id: int
        :return: True if the user was deleted, False if the user was not found
        :rtype: bool
        """
        user = await self.get_by_id(user_id)
        if not user:
            return False
        await self.db.delete(user)
        await self.db.commit()
        return True

    async def list_managers(self, skip: int = 0, limit: int = 100) -> list[FacilityAdmin]:
        """
        Retrieve all facility managers.
        """
        stmt = select(FacilityAdmin).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_manager_by_id(self, manager_id: int) -> Optional[FacilityAdmin]:
        """
        Retrieve a facility manager by ID.
        """
        stmt = select(FacilityAdmin).where(FacilityAdmin.id == manager_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_manager_by_email(self, email: str) -> Optional[FacilityAdmin]:
        """
        Retrieve a facility manager by email.
        """
        stmt = select(FacilityAdmin).where(FacilityAdmin.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_manager(self, manager_create: ManagerCreate, hashed_password: str) -> FacilityAdmin:
        """
        Create a new facility manager in the database.
        """
        new_manager = FacilityAdmin(
            email=manager_create.email,
            fullname=manager_create.fullname,
            idnum=manager_create.idnum,
            hashed_password=hashed_password,
            role=manager_create.role.value if manager_create.role else "facility_manager",
            work_unit=manager_create.work_unit,
            is_active=manager_create.is_active,
            created_at=datetime.datetime.now()
        )
        self.db.add(new_manager)
        await self.db.commit()
        await self.db.refresh(new_manager)
        return new_manager

    async def update_manager(self, manager_id: int, **kwargs: Any) -> Optional[FacilityAdmin]:
        """
        Update a facility manager's fields.
        """
        manager = await self.get_manager_by_id(manager_id)
        if not manager:
            return None
        for key, value in kwargs.items():
            setattr(manager, key, value)
        manager.updated_at = datetime.datetime.now()
        await self.db.commit()
        await self.db.refresh(manager)
        return manager

    async def delete_manager(self, manager_id: int) -> bool:
        """
        Delete a facility manager.
        """
        manager = await self.get_manager_by_id(manager_id)
        if not manager:
            return False
        await self.db.delete(manager)
        await self.db.commit()
        return True
