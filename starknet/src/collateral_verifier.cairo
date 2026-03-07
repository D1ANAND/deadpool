#[starknet::interface]
pub trait ICollateralVerifier<TContractState> {
    fn submit_utxo_commitment(
        ref self: TContractState,
        btc_address_hash: felt252,
        amount: felt252,
        nonce: felt252,
        minimum_threshold: felt252
    );
    fn is_proof_valid(self: @TContractState, proof_hash: felt252) -> bool;
}

#[starknet::contract]
pub mod CollateralVerifier {
    use core::starknet::ContractAddress;
    use core::starknet::get_caller_address;
    use core::starknet::get_block_timestamp;
    use core::pedersen::pedersen;

    #[storage]
    struct Storage {
        valid_proofs: starknet::storage::Map::<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ProofVerified: ProofVerified,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProofVerified {
        pub prover: ContractAddress,
        pub proof_hash: felt252,
        pub timestamp: u64,
    }

    #[abi(embed_v0)]
    impl CollateralVerifierImpl of super::ICollateralVerifier<ContractState> {
        fn submit_utxo_commitment(
            ref self: ContractState,
            btc_address_hash: felt252,
            amount: felt252,
            nonce: felt252,
            minimum_threshold: felt252
        ) {
            // Wait: typically threshold is configured by owner, but parameters specified 
            // say "Accept a minimum_threshold param". We will respect minimum_threshold input for hackathon simplicity.
            
            // In Cairo, value comparison requires converting felt252 to u256
            let amount_u256: u256 = amount.into();
            let threshold_u256: u256 = minimum_threshold.into();
            
            assert(amount_u256 >= threshold_u256, 'Amount below threshold');

            // Compute the Pedersen hash commitment: hash(btc_addr_hash, amount, nonce)
            // Note: Pedersen hash takes 2 arguments, so we chain them.
            // Hash1 = pedersen(btc_addr_hash, amount)
            // Hash2 = pedersen(Hash1, nonce)
            let hash1 = pedersen(btc_address_hash, amount);
            let proof_hash = pedersen(hash1, nonce);

            self.valid_proofs.write(proof_hash, true);

            self.emit(Event::ProofVerified(ProofVerified {
                prover: get_caller_address(),
                proof_hash: proof_hash,
                timestamp: get_block_timestamp(),
            }));
        }

        fn is_proof_valid(self: @ContractState, proof_hash: felt252) -> bool {
            self.valid_proofs.read(proof_hash)
        }
    }
}
