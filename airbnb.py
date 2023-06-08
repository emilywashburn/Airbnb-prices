
import numpy as np
import pandas as pd
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, jsonify


#################################################
# Database Setup
#################################################
engine = create_engine("postgresql://postgres:Coty1209@localhost/airbnb_data2")
#print (engine)
# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(autoload_with=engine)
#print (Base.classes.keys())
# Save reference to the table
airbnb = Base.classes.airbnb

#################################################
# Flask Setup
#################################################
app = Flask(__name__)


#################################################
# Flask Routes
#################################################

@app.route("/")
def welcome():
    """List all available api routes."""
    return (
        f"Available Routes:<br/>"
        f"/api/v1.0/bedrooms<br/>"
        f"/api/v1.0/price/<price_limit>"
        f"/api/v1.0/cleanliness/<rating>"
    )

@app.route("/api/v1.0/bedrooms/<bedroom_num>")
def bedrooms(bedroom_num):
    # Create our session (link) from Python to the DB
    session = Session(engine)
    columns = airbnb.__table__.columns
    """Return the amount of bedrooms of each rental"""
    # Query all passengers
    column_Names= [col.name for col in list (airbnb.__table__.columns)]
    results = session.query(*columns).filter(airbnb.bedrooms == bedroom_num).all()
    
    session.close()
    df = pd.DataFrame (columns= column_Names, data = results).to_json(orient='records')

    return df


@app.route("/api/v1.0/price/<price_limit>")
def price(price_limit):
    # Create our session (link) from Python to the DB
    session = Session(engine)
    columns = airbnb.__table__.columns
    """Return the price of each rental"""
    # Query all passengers
    column_Names= [col.name for col in list (airbnb.__table__.columns)]
    results = session.query(*columns).filter(airbnb.realsum <= price_limit).all()
    
    session.close()
    price_df = pd.DataFrame (columns= column_Names, data = results).to_json(orient='records')
    
    return price_df

@app.route("/api/v1.0/cleanliness/<rating>")
def clean(rating):
    # Create our session (link) from Python to the DB
    session = Session(engine)
    columns = airbnb.__table__.columns
    """Return the amount of bedrooms of each rental"""
    # Query all passengers
    column_Names= [col.name for col in list (airbnb.__table__.columns)]
    results = session.query(*columns).filter(airbnb.cleanliness_rating == rating).all()
    
    session.close()
    clean_df = pd.DataFrame (columns= column_Names, data = results).to_json(orient='records')

    return clean_df

if __name__ == '__main__':
    app.run(debug=True)
