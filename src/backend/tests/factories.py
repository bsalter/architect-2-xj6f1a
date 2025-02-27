"""
Provides factory classes to generate test instances of application models using factory_boy.
These factories are used in tests to create test data with realistic default values.
"""

import factory
from faker import Faker  # version 15.1.1
import datetime  # standard library
import random  # standard library
import pytz  # version 2022.7
import bcrypt  # version 4.0.1

from ..auth.models import User, UserSite
from ..sites.models import Site
from ..interactions.models import Interaction
from ..database import db

# Global factory faker for generating fake data
faker = factory.Faker


@factory.alchemy.SQLAlchemyModelFactory
class UserFactory:
    """Factory for creating User instances for testing"""
    
    class Meta:
        model = User
        sqlalchemy_session = db.session
    
    username = factory.Faker('user_name')
    email = factory.LazyAttribute(lambda o: f'{o.username}@example.com')
    password_hash = factory.LazyFunction(lambda: bcrypt.hashpw('password'.encode(), bcrypt.gensalt()).decode())
    last_login = factory.LazyFunction(lambda: datetime.datetime.now())
    is_active = True
    
    @factory.post_generation
    def create_password(self, create, extracted, **kwargs):
        """Set password for user after creation"""
        if create and extracted and 'password' in extracted:
            self.password_hash = bcrypt.hashpw(
                extracted['password'].encode(), 
                bcrypt.gensalt()
            ).decode()


@factory.alchemy.SQLAlchemyModelFactory
class SiteFactory:
    """Factory for creating Site instances for testing"""
    
    class Meta:
        model = Site
        sqlalchemy_session = db.session
    
    name = factory.Sequence(lambda n: f'Test Site {n}')
    description = factory.Faker('paragraph', nb_sentences=3)
    is_active = True


@factory.alchemy.SQLAlchemyModelFactory
class UserSiteFactory:
    """Factory for creating UserSite associations for testing"""
    
    class Meta:
        model = UserSite
        sqlalchemy_session = db.session
    
    user = factory.SubFactory(UserFactory)
    site = factory.SubFactory(SiteFactory)
    role = factory.Iterator(['Administrator', 'Editor', 'Viewer'])
    assigned_at = factory.LazyFunction(lambda: datetime.datetime.now())


@factory.alchemy.SQLAlchemyModelFactory
class InteractionFactory:
    """Factory for creating Interaction instances for testing"""
    
    class Meta:
        model = Interaction
        sqlalchemy_session = db.session
    
    site = factory.SubFactory(SiteFactory)
    title = factory.Faker('sentence', nb_words=6)
    type = factory.Iterator(['Meeting', 'Call', 'Email', 'Conference', 'Training'])
    lead = factory.Faker('name')
    start_datetime = factory.LazyFunction(lambda: datetime.datetime.now() + datetime.timedelta(days=random.randint(1, 30)))
    timezone = factory.Iterator(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'])
    end_datetime = factory.LazyAttribute(lambda o: o.start_datetime + datetime.timedelta(hours=1))
    location = factory.Faker('address')
    description = factory.Faker('paragraph', nb_sentences=3)
    notes = factory.Faker('paragraph', nb_sentences=2)
    created_by = factory.SubFactory(UserFactory)
    created_at = factory.LazyFunction(lambda: datetime.datetime.now())
    updated_by = factory.SelfAttribute('created_by')
    updated_at = factory.SelfAttribute('created_at')