from werkzeug.local import LocalProxy
import pickle

from myfecviz import get_db

db = LocalProxy(get_db)

def get_number_of_candidates():
    print "hit get candidates"
    """Return the number of candidates registered with the FEC.

    This serves as just an example query.

    :returns: integer
    """
    # Execute database query
    db.execute("SELECT COUNT(*) FROM candidates;")
    results = db.fetchall()

    # Package into output
    return int(results[0][0])

def get_all_transaction_amounts():
    print "hit get all transaction amounts"
    """Return all transaction amounts with the state that the contribution came from.

    For all committee contributions with a transaction_amt greater than zero,
    return every transaction amount with the state that the contribution came form.

    :return: List of dictionaries with 'state' and 'amount' keys
    """
    # Execute database query

    # http://initd.org/psycopg/docs/usage.html#basic-module-usage

    db.execute("SELECT cc.state, cc.transaction_amt FROM committee_contributions cc WHERE cc.transaction_amt > 0;")
    tuple_list = db.fetchall()

    dict_list = []

    for tuple in tuple_list:
        state = tuple[0]
        if state == None: continue
        amount = tuple[1]
        dict = {'state': state, 'amount': amount}
        dict_list.append(dict)

    # Package into output
    return dict_list

def get_total_transaction_amounts_by_state():
    print "hit get total transaction amounts by state"
    """Return a list of dicts containing the state and total contributions.

    For all committee contributions with a transaction_amt greater than zero,
    return a dictionary containing the state and total amount.

    :returns: List of dictionaries with 'state' and 'total_amount' keys
    """
    # Execute database query

    db.execute("SELECT cc.state, SUM(cc.transaction_amt) FROM committee_contributions cc WHERE cc.transaction_amt > 0 GROUP BY cc.state;")
    tuple_list = db.fetchall()

    dict_list = []

    for tuple in tuple_list:
        state = tuple[0]
        if state == None: continue
        total_amount = tuple[1]
        dict = {'state': state, 'total_amount': total_amount}
        dict_list.append(dict)

    # Package into list of dictionaries
    return dict_list
