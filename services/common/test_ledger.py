from services.common.ledger import GENESIS_HASH, make_entry, verify_chain


def test_chain_accepts_entries():
    first = make_entry(1, GENESIS_HASH, cell="broker", action="bootstrap")
    second = make_entry(2, first["entry_hash"], cell="red", action="request")
    assert verify_chain([first, second]) == (True, None, None)


def test_chain_detects_edit():
    first = make_entry(1, GENESIS_HASH, cell="broker", action="bootstrap")
    edited = {**first, "action": "tampered"}
    ok, seq, reason = verify_chain([edited])
    assert not ok and seq == 1 and "hash" in reason


def test_chain_detects_delete_insert_and_reorder():
    first = make_entry(1, GENESIS_HASH, cell="broker", action="bootstrap")
    second = make_entry(2, first["entry_hash"], cell="red", action="request")
    third = make_entry(3, second["entry_hash"], cell="ledger", action="append")
    assert verify_chain([first, third])[0] is False
    assert verify_chain([second, first, third])[0] is False
    assert verify_chain([first, second, {**third, "seq": 4}])[0] is False
